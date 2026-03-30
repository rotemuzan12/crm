import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout(): React.ReactElement {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
