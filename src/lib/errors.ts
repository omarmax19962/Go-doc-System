export function friendlyError(message: string): string {
  if (!message) return 'Something went wrong. Please try again.'

  const m = message.toLowerCase()

  if (m.includes('duplicate') || m.includes('unique'))
    return 'This record already exists. Please check for duplicates.'
  if (m.includes('not-null') || m.includes('null value'))
    return 'A required field is missing. Please fill in all required fields.'
  if (m.includes('foreign key') || m.includes('violates foreign'))
    return 'This action references a record that no longer exists.'
  if (m.includes('permission denied') || m.includes('row-level security'))
    return 'You do not have permission to perform this action.'
  if (m.includes('invalid input') || m.includes('invalid value'))
    return 'One of the values you entered is invalid. Please check and try again.'
  if (m.includes('connection') || m.includes('network'))
    return 'Could not reach the server. Please check your connection and try again.'
  if (m.includes('jwt') || m.includes('token') || m.includes('session'))
    return 'Your session has expired. Please log in again.'
  if (m.includes('too long') || m.includes('value too long'))
    return 'One of the fields is too long. Please shorten it and try again.'
  if (m.includes('does not exist'))
    return 'The record you are looking for no longer exists.'
  if (m.includes('email') && m.includes('already'))
    return 'An account with this email already exists.'
  if (m.includes('invalid email'))
    return 'Please enter a valid email address.'
  if (m.includes('password'))
    return 'Password must be at least 6 characters.'

  return 'Something went wrong. Please try again.'
}
