import { getCategories } from '@/api/categories'
import { AnnouncementBar } from './AnnouncementBar'
import { NavClient } from './NavClient'

// RSC — fetches categories once per request, passes as props to the client shell.
// No loading state needed here: Next.js streaming handles it.
export async function Navbar() {
  let categories = await getCategories().catch(() => [])

  return (
    <>
      <AnnouncementBar />
      <NavClient categories={categories} />
    </>
  )
}
