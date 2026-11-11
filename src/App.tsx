import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ChatWidget } from './components/chat/ChatWidget'
import { BookPage } from './pages/BookPage'
import { BookReaderPage } from './pages/BookReaderPage'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'

/** Route table: add a page here. The chat sits outside the routes so a conversation survives opening a source. */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books/:slug" element={<BookPage />} />
        <Route path="/books/:slug/read" element={<BookReaderPage />} />
        <Route path="/books/:slug/read/:chapter" element={<BookReaderPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  )
}
