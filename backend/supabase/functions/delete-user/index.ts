import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4'

const corsHeaders = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    status,
  })

const missingObjectCodes = new Set(['42P01', '42703'])

const getStoragePath = (fileUrl: string | null | undefined, bucket: string) => {
  if (!fileUrl) {
    return ''
  }

  const marker = `/storage/v1/object/public/${bucket}/`

  try {
    const url = new URL(fileUrl)
    const markerIndex = url.pathname.indexOf(marker)

    if (markerIndex === -1) {
      return ''
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    const markerIndex = fileUrl.indexOf(`${bucket}/`)

    if (markerIndex === -1) {
      return ''
    }

    return decodeURIComponent(
      fileUrl.slice(markerIndex + bucket.length + 1).split('?')[0],
    )
  }
}

const deleteUserRows = async (
  client: ReturnType<typeof createClient>,
  table: string,
  userId: string,
) => {
  const { error } = await client.from(table).delete().eq('user_id', userId)

  if (error && !missingObjectCodes.has(error.code)) {
    throw new Error(`Could not delete ${table}: ${error.message}`)
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: 'Delete user function is not configured.' },
      500,
    )
  }

  const authorization = request.headers.get('Authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return jsonResponse({ error: 'Unauthorized.' }, 401)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const {
    data: { user: requestingUser },
    error: requestingUserError,
  } = await adminClient.auth.getUser(token)

  if (requestingUserError || !requestingUser) {
    return jsonResponse({ error: 'Unauthorized.' }, 401)
  }

  const { data: requestingProfile, error: requestingProfileError } =
    await adminClient
      .from('profiles')
      .select('id, user_id, is_admin, role, status')
      .eq('user_id', requestingUser.id)
      .maybeSingle()

  if (requestingProfileError) {
    console.error('delete-user admin profile lookup failed', requestingProfileError)
    return jsonResponse({ error: 'Could not verify admin access.' }, 500)
  }

  const isAdmin =
    requestingProfile?.is_admin === true || requestingProfile?.role === 'admin'

  if (!requestingProfile || requestingProfile.status === 'disabled' || !isAdmin) {
    return jsonResponse({ error: 'Unauthorized.' }, 403)
  }

  let body: { allowSelfDelete?: boolean; userId?: unknown }

  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid delete request.' }, 400)
  }

  const targetUserId =
    typeof body.userId === 'string' ? body.userId.trim() : ''

  if (!targetUserId) {
    return jsonResponse({ error: 'Target user is required.' }, 400)
  }

  if (targetUserId === requestingUser.id && body.allowSelfDelete !== true) {
    return jsonResponse(
      { error: 'Admins cannot permanently delete their own account here.' },
      400,
    )
  }

  const { data: targetAuthUser, error: targetUserError } =
    await adminClient.auth.admin.getUserById(targetUserId)

  if (targetUserError || !targetAuthUser?.user) {
    return jsonResponse({ error: 'Target user not found.' }, 404)
  }

  try {
    const { data: targetProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (profileError && !missingObjectCodes.has(profileError.code)) {
      throw new Error(`Could not read target profile: ${profileError.message}`)
    }

    const { data: targetMemories, error: memoriesError } = await adminClient
      .from('memories')
      .select('proof_image_url')
      .eq('user_id', targetUserId)

    if (memoriesError && !missingObjectCodes.has(memoriesError.code)) {
      throw new Error(`Could not read target memories: ${memoriesError.message}`)
    }

    const proofPaths = Array.from(
      new Set(
        (targetMemories || [])
          .map((memory) => getStoragePath(memory.proof_image_url, 'memory-proofs'))
          .filter(Boolean),
      ),
    )

    if (proofPaths.length > 0) {
      const { error: proofDeleteError } = await adminClient.storage
        .from('memory-proofs')
        .remove(proofPaths)

      if (proofDeleteError) {
        console.warn('delete-user proof image cleanup failed', proofDeleteError)
      }
    }

    const avatarPath = getStoragePath(targetProfile?.avatar_url, 'avatars')

    if (avatarPath) {
      const { error: avatarDeleteError } = await adminClient.storage
        .from('avatars')
        .remove([avatarPath])

      if (avatarDeleteError) {
        console.warn('delete-user avatar cleanup failed', avatarDeleteError)
      }
    }

    await deleteUserRows(adminClient, 'card_draws', targetUserId)
    await deleteUserRows(adminClient, 'user_collectible_cards', targetUserId)
    await deleteUserRows(adminClient, 'user_badges', targetUserId)
    await deleteUserRows(adminClient, 'artist_fans', targetUserId)
    await deleteUserRows(adminClient, 'memories', targetUserId)

    const { error: artistCreatorError } = await adminClient
      .from('artists')
      .update({ created_by: null })
      .eq('created_by', targetUserId)

    if (artistCreatorError && !missingObjectCodes.has(artistCreatorError.code)) {
      throw new Error(
        `Could not clear created fandom ownership: ${artistCreatorError.message}`,
      )
    }

    await deleteUserRows(adminClient, 'profiles', targetUserId)

    const { error: authDeleteError } =
      await adminClient.auth.admin.deleteUser(targetUserId)

    if (authDeleteError) {
      throw new Error(authDeleteError.message)
    }

    return jsonResponse({
      deletedUserId: targetUserId,
      message: 'User permanently deleted.',
      success: true,
    })
  } catch (error) {
    console.error('delete-user failed', error)
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'User could not be permanently deleted.',
      },
      500,
    )
  }
})
