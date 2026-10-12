import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Nav from '@/components/layout/Nav'
import LoaderScreen from '@/components/layout/LoaderScreen'

const Landing         = lazy(() => import('@/pages/Landing'))
const DataExplorer    = lazy(() => import('@/pages/DataExplorer'))
const ClassificationLab = lazy(() => import('@/pages/ClassificationLab'))
const ClusteringLab   = lazy(() => import('@/pages/ClusteringLab'))
const ModelStage      = lazy(() => import('@/pages/ModelStage'))
const Playground      = lazy(() => import('@/pages/Playground'))
const Arena           = lazy(() => import('@/pages/Arena'))
const About           = lazy(() => import('@/pages/About'))
const NotFound        = lazy(() => import('@/pages/NotFound'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Nav />
        <Suspense fallback={<LoaderScreen />}>
          <Routes>
            <Route path="/"                       element={<Landing />} />
            <Route path="/data"                   element={<DataExplorer />} />
            <Route path="/classification"         element={<ClassificationLab />} />
            <Route path="/classification/:modelId" element={<ModelStage />} />
            <Route path="/clustering"             element={<ClusteringLab />} />
            <Route path="/playground"             element={<Playground />} />
            <Route path="/arena"                  element={<Arena />} />
            <Route path="/about"                  element={<About />} />
            <Route path="*"                       element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
