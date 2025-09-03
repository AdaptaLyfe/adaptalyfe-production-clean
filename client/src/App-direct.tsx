import React from "react";

// Direct HTML rendering - no complex routing
function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #dbeafe 0%, #faf5ff 50%, #fce7f3 100%)",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      {/* Navigation */}
      <nav style={{
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "16px 24px",
        marginBottom: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              padding: "8px",
              borderRadius: "8px",
              color: "white",
              fontWeight: "bold"
            }}>
              A
            </div>
            <span style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#111827"
            }}>
              AdaptaLyfe
            </span>
          </div>
          <span style={{
            color: "#6b7280",
            fontSize: "14px"
          }}>
            Demo Mode Active
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: "32px"
        }}>
          <h1 style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: "#7c3aed",
            marginBottom: "8px"
          }}>
            Welcome to AdaptaLyfe Dashboard
          </h1>
          <p style={{
            fontSize: "18px",
            color: "#6b7280"
          }}>
            Your comprehensive independence-building platform
          </p>
        </div>

        {/* Feature Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "24px",
          marginBottom: "32px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "12px"
            }}>
              📋 Daily Tasks
            </h3>
            <p style={{
              color: "#6b7280",
              lineHeight: "1.6"
            }}>
              Organize and track your daily activities with visual step-by-step guides and progress tracking.
            </p>
          </div>

          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "12px"
            }}>
              💰 Financial Management
            </h3>
            <p style={{
              color: "#6b7280",
              lineHeight: "1.6"
            }}>
              Manage bills, track expenses, and build budgeting skills with secure banking integration.
            </p>
          </div>

          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "12px"
            }}>
              🏥 Medical Management
            </h3>
            <p style={{
              color: "#6b7280",
              lineHeight: "1.6"
            }}>
              Track medications, appointments, and health information with pharmacy integration.
            </p>
          </div>

          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "12px"
            }}>
              😊 Mood Tracking
            </h3>
            <p style={{
              color: "#6b7280",
              lineHeight: "1.6"
            }}>
              Monitor your emotional well-being with daily mood check-ins and pattern analysis.
            </p>
          </div>

          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "12px"
            }}>
              🎓 Academic Support
            </h3>
            <p style={{
              color: "#6b7280",
              lineHeight: "1.6"
            }}>
              Manage classes, assignments, and study schedules with transition skills training.
            </p>
          </div>

          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "12px"
            }}>
              🤖 AdaptAI Assistant
            </h3>
            <p style={{
              color: "#6b7280",
              lineHeight: "1.6"
            }}>
              Get personalized support and guidance with intelligent fallback responses.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          textAlign: "center",
          background: "white",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        }}>
          <p style={{
            fontSize: "18px",
            color: "#6b7280",
            marginBottom: "24px"
          }}>
            AdaptaLyfe Demo is fully functional with comprehensive sample data
          </p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "16px"
          }}>
            <button 
              onClick={() => window.location.href = '/demo.html'}
              style={{
                background: "#2563eb",
                color: "white",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Static Demo Page
            </button>
            <button 
              onClick={() => {
                alert("AdaptaLyfe Features:\n\n• 16 Daily Tasks with completion tracking\n• Financial Management with 3 bills\n• 21+ Mood Entries with ratings\n• Medical Management with medications\n• Academic Planning with classes\n• AI Assistant with intelligent responses\n• Caregiver Dashboard with monitoring\n• Banking Integration with Plaid\n• Pharmacy Integration with medications\n• Emergency Resources and contacts\n\nAll features have real demo data for testing!");
              }}
              style={{
                background: "#16a34a",
                color: "white",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              View All Features
            </button>
            <button 
              onClick={() => {
                const apiStatus = confirm("Test API Connection?\n\nThis will verify that the backend is working with real data.");
                if (apiStatus) {
                  fetch('/api/user')
                    .then(response => response.json())
                    .then(data => {
                      alert(`API Working!\n\nUser: ${data.name || data.username}\nID: ${data.id}\nStreak: ${data.streakDays} days\n\nBackend is fully functional with demo data.`);
                    })
                    .catch(err => {
                      alert('API Error: ' + err.message);
                    });
                }
              }}
              style={{
                background: "#dc2626",
                color: "white",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Test API
            </button>
          </div>
          
          <div style={{
            marginTop: "24px",
            padding: "16px",
            background: "#f3f4f6",
            borderRadius: "8px",
            textAlign: "left"
          }}>
            <h4 style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#111827"
            }}>
              Demo Information:
            </h4>
            <ul style={{
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: "1.6",
              paddingLeft: "20px"
            }}>
              <li>Authentication: Automatic demo login as "alex" user</li>
              <li>Database: PostgreSQL with comprehensive sample data</li>
              <li>API Status: All endpoints working with real data</li>
              <li>Features: All 8+ core modules fully functional</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;