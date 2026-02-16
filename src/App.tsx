import './App.css'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import { DashboardProvider } from './context/DashboardContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <DashboardProvider>
        <Layout>
          <Dashboard />
        </Layout>
      </DashboardProvider>
    </ThemeProvider>
  )
}

export default App
