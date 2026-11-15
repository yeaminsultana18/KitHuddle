import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-7">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
