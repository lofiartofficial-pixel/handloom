import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/ShopComponents'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
