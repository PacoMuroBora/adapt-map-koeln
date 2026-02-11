import { redirect } from 'next/navigation'

export default function QRRedirectPage() {
  // Redirect to the location page to start the reporting flow
  redirect('/location')
}

