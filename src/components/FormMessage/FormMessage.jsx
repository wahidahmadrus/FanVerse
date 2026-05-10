import './FormMessage.css'

function FormMessage({ children, type = 'info' }) {
  if (!children) {
    return null
  }

  return (
    <div className={`form-message form-message--${type}`} role="status">
      {children}
    </div>
  )
}

export default FormMessage
