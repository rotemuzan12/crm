import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@renderer/components/layout/Layout'
import Dashboard from '@renderer/pages/Dashboard'
import ClientsPage from '@renderer/pages/Clients'
import ClientDetail from '@renderer/pages/Clients/ClientDetail'
import ContactsPage from '@renderer/pages/Contacts'
import DealsPage from '@renderer/pages/Deals'
import TasksPage from '@renderer/pages/Tasks'
import SettingsPage from '@renderer/pages/Settings'

export default function App(): React.ReactElement {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
