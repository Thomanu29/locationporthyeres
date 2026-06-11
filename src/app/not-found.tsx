import Header from '@/components/Header'
import Footer from '@/components/Footer'
import NotFoundContent from '@/components/NotFoundContent'

export default function NotFound() {
  return (
    <>
      <Header variant="solid" />
      <main className="flex-1 flex items-center justify-center py-20">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  )
}
