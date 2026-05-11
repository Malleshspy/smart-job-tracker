import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import ResumeOptimizer from './ResumeOptimizer';
import AuthScreen from './AuthScreen'; 
import { AuthContext } from './AuthContext'; 

function App() {
  const { user, logout } = useContext(AuthContext);

  const [applications, setApplications] = useState([]);
  const [formData, setFormData] = useState({ companyName: '', jobTitle: '', status: 'Applied' });
  const [resumeFile, setResumeFile] = useState(null); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('companyName', formData.companyName);
    data.append('jobTitle', formData.jobTitle);
    data.append('status', formData.status);
    
    if (resumeFile) {
      data.append('resumeFile', resumeFile);
    }

    try {
      await axios.post('https://smart-job-tracker-w66c.onrender.com/api/applications', data, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.token}` 
        }
      });
      fetchApplications(); 
      setFormData({ companyName: '', jobTitle: '', status: 'Applied' }); 
      setResumeFile(null); 
      document.getElementById('resumeFileInput').value = ''; 
     }
    catch (err) {
      console.error('Error submitting application', err);
    }
  }; // <-- Notice how it ends cleanly here now!

  const fetchApplications = async () => {
    try {
      const res = await axios.get('https://smart-job-tracker-w66c.onrender.com/api/applications', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setApplications(res.data);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  const deleteApplication = async (id) => {
    try {
      await axios.delete(`https://smart-job-tracker-w66c.onrender.com/api/applications/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchApplications(); 
    } catch (err) {
      console.error('Error deleting application', err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`https://smart-job-tracker-w66c.onrender.com/api/applications/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchApplications(); 
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  // ==========================================
  // ANALYTICS & FILTERING LOGIC
  // ==========================================
  
  const totalJobs = applications.length;
  const interviewingCount = applications.filter(app => app.status === 'Interviewing').length;
  const offerCount = applications.filter(app => app.status === 'Offer').length;

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'All' || app.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // <-- Duplicate check removed, only one remains!
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Smart Job Tracker</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>Hello, <strong>{user.name}</strong></span>
          <button onClick={logout} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>Add New Application</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" name="companyName" placeholder="Company Name" value={formData.companyName} onChange={handleChange} required style={{ padding: '8px', flex: 1 }}/>
            <input type="text" name="jobTitle" placeholder="Job Title" value={formData.jobTitle} onChange={handleChange} required style={{ padding: '8px', flex: 1 }}/>
            <select name="status" value={formData.status} onChange={handleChange} style={{ padding: '8px' }}>
              <option value="Saved">Saved</option>
              <option value="Applied">Applied</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Rejected">Rejected</option>
              <option value="Offer">Offer</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Resume Used:</label>
            <input id="resumeFileInput" type="file" accept="application/pdf, .doc, .docx" onChange={handleFileChange} style={{ fontSize: '14px' }} />
            <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}>
              Add Job
            </button>
          </div>

        </form>
      </div>

      <ResumeOptimizer />
      
      <div style={{ marginTop: '40px' }}>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ flex: 1, background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 5px 0', color: '#007bff' }}>{totalJobs}</h2>
            <span style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Total Applied</span>
          </div>
          <div style={{ flex: 1, background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 5px 0', color: '#ffc107' }}>{interviewingCount}</h2>
            <span style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Interviews</span>
          </div>
          <div style={{ flex: 1, background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 5px 0', color: '#28a745' }}>{offerCount}</h2>
            <span style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Offers</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <input 
            type="text" 
            placeholder="🔍 Search company or title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 2, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
          >
            <option value="All">All Statuses</option>
            <option value="Saved">Saved</option>
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Rejected">Rejected</option>
            <option value="Offer">Offer</option>
          </select>
        </div>

        <h3>My Applications</h3>
        {filteredApplications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#777', padding: '20px' }}>No jobs match your search.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredApplications.map((app) => (
              <div key={app._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                <div>
                  <strong style={{ fontSize: '18px' }}>{app.companyName}</strong>
                  <p style={{ margin: '5px 0', color: '#555' }}>{app.jobTitle}</p>
                  
                  {app.resumeUsed && (
                    <a 
                      href={app.resumeUsed} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#007bff', textDecoration: 'none', display: 'inline-block', marginTop: '5px', fontWeight: 'bold' }}
                    >
                      📄 View Resume Sent
                    </a>
                  )}
                  
                  <p style={{ fontSize: '12px', color: '#888', margin: '5px 0 0 0' }}>
                    Applied: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <select 
                    value={app.status}
                    onChange={(e) => updateStatus(app._id, e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '14px', border: '1px solid #ccc', background: app.status === 'Offer' ? '#d4edda' : app.status === 'Rejected' ? '#f8d7da' : app.status === 'Interviewing' ? '#fff3cd' : '#e2e3e5' }}
                  >
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Offer">Offer</option>
                  </select>

                  <button onClick={() => deleteApplication(app._id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default App;