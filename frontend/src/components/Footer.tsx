import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-white)',
        borderTop: '1px solid var(--border-light)',
        padding: '2.5rem 0 2rem',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '2rem',
            marginBottom: '2rem',
          }}
        >
          {/* Brand info */}
          <div style={{ maxWidth: '380px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                fontSize: '1.125rem',
                color: 'var(--color-charcoal-strong)',
                marginBottom: '0.75rem',
              }}
            >
              <span>HatchMatch</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.55 }}>
              Connecting grassroots Indian problems with student innovators. Empowering developers to build
              what matters and verify project novelty against existing real-world solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-charcoal-strong)',
                  marginBottom: '0.75rem',
                }}
              >
                Platform
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  fontSize: '0.875rem',
                  color: 'var(--color-charcoal-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <li>I Have a Problem</li>
                <li>I Am a Builder</li>
                <li>Real Problems Board</li>
                <li>Novelty Verification</li>
              </ul>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-charcoal-strong)',
                  marginBottom: '0.75rem',
                }}
              >
                Community
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  fontSize: '0.875rem',
                  color: 'var(--color-charcoal-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <li>Grassroots Innovators</li>
                <li>Student Builders</li>
                <li>Hackathon Mentors</li>
                <li>Domain Experts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div
          style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--color-charcoal-subtle)',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} HatchMatch. Real Problems. Authentic Builders.
          </div>
          <div>
            Empowering meaningful grassroots innovation.
          </div>
        </div>
      </div>
    </footer>
  )
}
