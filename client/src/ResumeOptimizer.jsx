// client/src/ResumeOptimizer.jsx
import { useState, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function ResumeOptimizer() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // Changed state to hold the whole JSON object
  
  const resumeRef = useRef(); // This ref ensures only the resume gets turned into a PDF

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleOptimize = async (e) => {
    e.preventDefault();
    if (!file || !jobDescription) return alert("Please provide both.");

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    setLoading(true);
    setAiResult(null); 
    try {
      const res = await axios.post('https://your-backend.onrender.com', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Set the entire JSON object to state
      setAiResult(res.data); 
    } catch (err) {
      console.error(err);
      alert("Error processing request. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

 const handleDownloadWord = () => {
    const element = resumeRef.current; 

    // 1. Wrap the HTML and inject our strict CSS directly into the Word document header
    const preHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>ATS Resume</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.25; }
          a { color: #000; text-decoration: none; font-weight: bold; }
          h1 { text-align: center; font-size: 20pt; margin: 0 0 4px 0; font-weight: bold; }
          h1 + p { text-align: center; font-size: 10pt; margin: 0 0 12px 0; }
          h2 { font-size: 12pt; text-transform: uppercase; border-bottom: 1px solid #000; margin: 12px 0 6px 0; padding-bottom: 2px; }
          h3 { font-size: 11pt; margin: 8px 0 2px 0; font-weight: bold; }
          em { font-size: 10.5pt; display: block; margin-bottom: 4px; }
          ul { padding-left: 20px; margin: 4px 0 8px 0; }
          li { font-size: 10pt; margin-bottom: 3px; }
          p { font-size: 10pt; margin-bottom: 6px; text-align: justify; }
        </style>
      </head><body>
    `;
    const postHtml = "</body></html>";
    
    // Combine the header, the actual resume HTML, and the footer
    const html = preHtml + element.innerHTML + postHtml;

    // 2. Create a Blob (Binary Large Object) with the MS Word MIME type
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });

    // 3. Create a temporary link to download the Blob and click it
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = 'Optimized_ATS_Resume.doc';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: '#e9ecef', padding: '20px', borderRadius: '8px', marginTop: '30px', fontFamily: 'sans-serif' }}>
      <h2>AI Resume Optimizer</h2>
      <form onSubmit={handleOptimize} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>1. Upload Base Resume (PDF): </label>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
        </div>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>2. Paste Job Description:</label>
          <textarea rows="6" style={{ width: '100%', padding: '10px' }} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px', background: loading ? '#ccc' : '#28a745', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
          {loading ? 'Analyzing & Optimizing...' : 'Analyze Resume'}
        </button>
      </form>

      {/* --- DISPLAY AI RESULTS --- */}
      {aiResult && (
        <div style={{ marginTop: '30px' }}>
          
          {/* 1. THE SCORECARD DASHBOARD */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
            <h3>ATS Match Score: <span style={{ color: aiResult.matchPercentage > 70 ? '#28a745' : '#dc3545' }}>{aiResult.matchPercentage}%</span></h3>
            
            <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
              {/* Found Skills (Green) */}
              <div style={{ flex: 1, background: '#d4edda', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#155724', marginTop: 0 }}>✅ Matched Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {aiResult.foundSkills.map(skill => (
                    <span key={skill} style={{ background: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', border: '1px solid #c3e6cb' }}>{skill}</span>
                  ))}
                </div>
              </div>

              {/* Missing Skills (Red) */}
              <div style={{ flex: 1, background: '#f8d7da', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#721c24', marginTop: 0 }}>❌ Missing Skills (Add to resume if you know them!)</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {aiResult.missingSkills.map(skill => (
                    <span key={skill} style={{ background: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', border: '1px solid #f5c6cb' }}>{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. THE OPTIMIZED RESUME (For Download) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Your Optimized Document:</h3>
            <button onClick={handleDownloadWord} style={{ background: '#2B579A', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
  📄 Download Word Doc
</button>
          </div>

          {/* We attach the 'ref' HERE so only the document prints, not the scorecard */}
          <div 
            ref={resumeRef} 
            className="resume-document" 
            style={{ padding: '40px', background: '#fff', minHeight: '500px' }}
          >
            <ReactMarkdown>{aiResult.optimizedResumeText}</ReactMarkdown> 
          </div>

        </div>
      )}
    </div>
  );
}

export default ResumeOptimizer;