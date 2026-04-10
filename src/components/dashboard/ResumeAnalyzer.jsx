import { useState, useRef } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';

const ResumeAnalyzer = ({ onRoadmapGenerated }) => {
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const roles = ['Software Engineer', 'Data Scientist', 'Web Developer'];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please upload a valid PDF file.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please upload a valid PDF file.');
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const analyzeResume = async () => {
    if (!selectedFile) {
      setError('Please upload a resume first.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('role', targetRole);

    try {
      const response = await axios.post(buildApiUrl('/api/analyze-resume'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAnalysis(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to analyze resume.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!analysis || !analysis.roadmap.length) {
      window.alert('Analyze the resume to generate a roadmap, or no missing skills found!');
      return;
    }

    // Convert to compatible roadmap format for the Dashboard
    const formattedSteps = analysis.roadmap.map((item, idx) => ({
      name: item.skill,
      description: item.task,
      duration: item.duration,
      mainFocusTopics: [`${item.skill} concepts`, `Practice ${item.skill}`],
      resources: [],
      priority: idx < 2 ? 'High' : 'Medium'
    }));

    await onRoadmapGenerated({
      steps: formattedSteps,
      dreamGoal: targetRole,
      knowledgeLevel: analysis.ats_score >= 70 ? 'intermediate' : 'beginner',
      knowledgeDetails: `ATS Score: ${analysis.ats_score}%`,
      duration: formattedSteps.length * 4, // 4 days each
      dailyTime: 2,
      recommendedSkills: analysis.missing_skills,
    });
  };

  return (
    <div className="page active">
      <h1 className="section-title animate-on-scroll">Resume Analyzer</h1>
      <p className="section-subtitle animate-on-scroll">
        Upload your resume perfectly formatted as a PDF, select your dream role, get your ATS score, and automatically discover skill gaps to build a personalized learning roadmap.
      </p>

      <div className="widget" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="targetRole" style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Dream Role</label>
          <select
            id="targetRole"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
          >
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Upload Resume (PDF)</label>
          
          <div 
            className={`file-drop-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            style={{
              border: `2px dashed ${isDragging ? '#f47b20' : '#ddd'}`,
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: isDragging ? '#fdf1e8' : '#fafafa',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf" 
              style={{ display: 'none' }} 
            />
            <div style={{ fontSize: '3rem', color: '#f47b20', marginBottom: '10px' }}>
              <i className="fas fa-file-pdf"></i>
            </div>
            {selectedFile ? (
              <div>
                <h4 style={{ color: '#333', marginBottom: '5px' }}>{selectedFile.name}</h4>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <h4 style={{ color: '#333', marginBottom: '5px' }}>Drag & Drop your PDF here</h4>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>or click to browse from your computer</p>
              </div>
            )}
          </div>
        </div>
        
        {error && <div style={{ color: '#e74c3c', marginBottom: '15px', padding: '10px', backgroundColor: '#fdecea', borderRadius: '8px', fontWeight: '500' }}>{error}</div>}

        <div className="step-actions" style={{ display: 'flex', gap: '15px' }}>
          <button 
            className="step-btn primary" 
            onClick={analyzeResume}
            disabled={isAnalyzing}
            style={{ flex: 1, justifyContent: 'center', opacity: isAnalyzing ? 0.7 : 1 }}
          >
            {isAnalyzing ? (
              <><i className="fas fa-spinner fa-spin"></i> Analyzing...</>
            ) : (
              <><i className="fas fa-magic"></i> Analyze Resume</>
            )}
          </button>
          
          {analysis && (
            <button 
              className="step-btn secondary" 
              onClick={handleGenerateRoadmap}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <i className="fas fa-road"></i> Build Learning Roadmap
            </button>
          )}
        </div>
      </div>

      {analysis && (
        <div className="widget animate-on-scroll">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
            <h3 className="widget-title" style={{ margin: 0 }}>ATS Analysis Results</h3>
            <div style={{ 
              backgroundColor: analysis.ats_score > 70 ? '#d4edda' : analysis.ats_score > 40 ? '#fff3cd' : '#f8d7da',
              color: analysis.ats_score > 70 ? '#155724' : analysis.ats_score > 40 ? '#856404' : '#721c24',
              padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem' 
            }}>
              ATS Score: {analysis.ats_score}%
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '20px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: '#f9fbfb', padding: '20px', borderRadius: '12px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a085', marginBottom: '15px' }}>
                <i className="fas fa-check-circle"></i> Skills Found Match
              </h4>
              <div className="skills-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {analysis.extracted_skills.length > 0 ? analysis.extracted_skills.map((skill) => (
                  <span key={skill} className="skill-tag" style={{ background: '#e8f8f5', color: '#16a085', border: '1px solid #1abc9c', padding: '6px 12px', borderRadius: '12px', fontSize: '0.9rem' }}>{skill}</span>
                )) : <span style={{ color: '#666', fontStyle: 'italic' }}>No matching core skills found.</span>}
              </div>
            </div>

            <div style={{ backgroundColor: '#fff5f5', padding: '20px', borderRadius: '12px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e74c3c', marginBottom: '15px' }}>
                <i className="fas fa-exclamation-circle"></i> Skill Gap
              </h4>
              <div className="skills-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {analysis.missing_skills.length > 0 ? analysis.missing_skills.map((skill) => (
                  <span key={skill} className="skill-tag" style={{ background: '#fdedec', color: '#c0392b', border: '1px solid #e74c3c', padding: '6px 12px', borderRadius: '12px', fontSize: '0.9rem' }}>{skill}</span>
                )) : <span style={{ color: '#666', fontStyle: 'italic' }}>You have all the required core skills!</span>}
              </div>
            </div>
          </div>

          {analysis.roadmap.length > 0 && (
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34495e', marginBottom: '15px' }}>
                <i className="fas fa-map-signs"></i> Learning Roadmap to close the gap
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analysis.roadmap.map((item, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', gap: '15px', 
                    padding: '15px', border: '1px solid #eee', borderRadius: '10px',
                    backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', 
                      backgroundColor: '#f47b20', color: '#fff', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <h5 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', color: '#333' }}>{item.skill}</h5>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                        <i className="far fa-clock" style={{ marginRight: '5px' }}></i> {item.task}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
