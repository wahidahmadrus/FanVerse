import { Link } from 'react-router-dom'
import './Button.css'

function Button({
  children,
  to,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const buttonClassName = `button button--${variant} ${className}`.trim()

  if (to) {
    return (
      <Link className={buttonClassName} to={to} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button className={buttonClassName} type={type} {...props}>
      {children}
    </button>
  )
}

export default Button
