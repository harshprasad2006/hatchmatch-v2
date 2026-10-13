import React, { useState } from 'react'
import { Navbar, type NavTab } from './components/Navbar'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { ProblemSubmitPage } from './pages/ProblemSubmitPage'
import { ProblemsBoardPage } from './pages/ProblemsBoardPage'
import { BuilderCheckPage } from './pages/BuilderCheckPage'
import { DashboardPage } from './pages/DashboardPage'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home')
  const [builderInitialText, setBuilderInitialText] = useState<string>('')

  const handleNavigate = (tab: NavTab) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSolveProblemFromBoard = (title: string, pain: string) => {
    setBuilderInitialText(`A solution addressing "${title}": Specifically targeting the pain that ${pain}. Features: `)
    setActiveTab('builder')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-layout">
      {/* Sticky Top Navigation */}
      <Navbar activeTab={activeTab} onSelectTab={handleNavigate} />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="container">
          {activeTab === 'home' && <HomePage onNavigate={handleNavigate} />}

          {activeTab === 'problem' && (
            <ProblemSubmitPage onNavigateToBoard={() => handleNavigate('board')} />
          )}

          {activeTab === 'board' && (
            <ProblemsBoardPage
              onNavigateToSubmit={() => handleNavigate('problem')}
              onSolveProblem={handleSolveProblemFromBoard}
            />
          )}

          {activeTab === 'builder' && (
            <BuilderCheckPage
              key={builderInitialText}
              initialIdeaText={builderInitialText}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigateToProblem={() => handleNavigate('problem')}
              onNavigateToBuilder={() => handleNavigate('builder')}
              onSolveProblem={handleSolveProblemFromBoard}
            />
          )}
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  )
}

export default App
