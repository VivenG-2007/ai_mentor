const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

async function generatePDFReport(reportData) {
  const { user, session, report, answers, questions } = reportData;
  
  return new Promise((resolve, reject) => {
    const filename = `report_${user._id}_week${report.weekNumber}_${report.year}_${Date.now()}.pdf`;
    const filepath = path.join(reportsDir, filename);
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filepath);
    
    doc.pipe(stream);
    
    // Header
    doc.rect(0, 0, 595, 100).fill('#0f172a');
    doc.fillColor('#6366f1').fontSize(28).font('Helvetica-Bold')
      .text('AI MENTOR', 50, 25);
    doc.fillColor('#a5b4fc').fontSize(12).font('Helvetica')
      .text('Weekly Performance Report', 50, 60);
    doc.fillColor('#94a3b8').fontSize(10)
      .text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 350, 60, { align: 'right', width: 195 });
    
    // User info box
    doc.rect(50, 120, 495, 60).fill('#1e293b').stroke('#334155');
    doc.fillColor('#f1f5f9').fontSize(16).font('Helvetica-Bold')
      .text(user.name, 70, 130);
    doc.fillColor('#94a3b8').fontSize(11).font('Helvetica')
      .text(user.email, 70, 152);
    doc.fillColor('#6366f1').fontSize(13).font('Helvetica-Bold')
      .text(`Week ${report.weekNumber} · ${report.year}`, 400, 140);
    
    // Overall Score
    doc.moveDown(3);
    doc.fillColor('#0f172a').fontSize(18).font('Helvetica-Bold')
      .text('Overall Score', 50, 210);
    
    const overallScore = Math.round(report.scores.overall || 0);
    const scoreColor = overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#f59e0b' : '#ef4444';
    
    doc.fillColor(scoreColor).fontSize(48).font('Helvetica-Bold')
      .text(`${overallScore}%`, 50, 235);
    doc.fillColor('#64748b').fontSize(12).font('Helvetica')
      .text(getScoreLabel(overallScore), 50, 290);
    
    // Section Scores
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold')
      .text('Section Performance', 50, 320);
    
    const sections = [
      { label: 'Subjective Assessment', score: report.scores.subjective, color: '#6366f1' },
      { label: 'English Proficiency', score: report.scores.english, color: '#06b6d4' },
      { label: 'Psychometric Analysis', score: report.scores.psychometric, color: '#8b5cf6' },
    ];
    
    sections.forEach((section, i) => {
      const y = 350 + i * 55;
      const score = Math.round(section.score || 0);
      const barWidth = (score / 100) * 350;
      
      doc.fillColor('#1e293b').rect(50, y, 495, 42).fill('#f8fafc').stroke('#e2e8f0');
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(section.label, 65, y + 8);
      doc.fillColor(section.color).fontSize(14).font('Helvetica-Bold').text(`${score}%`, 480, y + 8);
      doc.rect(65, y + 26, 350, 8).fill('#e2e8f0');
      if (barWidth > 0) doc.rect(65, y + 26, barWidth, 8).fill(section.color);
    });
    
    // Personality Traits
    doc.addPage();
    doc.rect(0, 0, 595, 50).fill('#0f172a');
    doc.fillColor('#a5b4fc').fontSize(16).font('Helvetica-Bold').text('Big Five Personality Traits (OCEAN)', 50, 15);
    
    const traits = [
      { label: 'Openness', key: 'openness', color: '#6366f1', desc: 'Curiosity and creativity' },
      { label: 'Conscientiousness', key: 'conscientiousness', color: '#06b6d4', desc: 'Organization and dependability' },
      { label: 'Extraversion', key: 'extraversion', color: '#f59e0b', desc: 'Social energy and assertiveness' },
      { label: 'Agreeableness', key: 'agreeableness', color: '#22c55e', desc: 'Cooperation and trust' },
      { label: 'Neuroticism', key: 'neuroticism', color: '#ef4444', desc: 'Emotional sensitivity' },
    ];
    
    traits.forEach((trait, i) => {
      const y = 70 + i * 60;
      const score = Math.round(report.personalityTraits?.[trait.key] || 0);
      const barWidth = (score / 100) * 380;
      
      doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold').text(trait.label, 50, y);
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(trait.desc, 50, y + 16);
      doc.fillColor(trait.color).fontSize(14).font('Helvetica-Bold').text(`${score}%`, 490, y + 5);
      doc.rect(50, y + 32, 380, 10).fill('#e2e8f0');
      if (barWidth > 0) doc.rect(50, y + 32, barWidth, 10).fill(trait.color);
    });
    
    // Strengths & Improvements
    const startY = 380;
    const colWidth = 220;
    
    // Left Column: Strengths
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('Key Strengths', 50, startY);
    let leftY = startY + 30;
    (report.strengths || []).slice(0, 5).forEach((s) => {
      doc.fillColor('#22c55e').fontSize(11).text('✓', 55, leftY);
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(s, 75, leftY, { width: colWidth, lineGap: 2 });
      leftY = doc.y + 15; // Move next item down based on where previous ended
    });
    
    // Right Column: Improvements
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('Areas for Improvement', 320, startY);
    let rightY = startY + 30;
    (report.improvements || []).slice(0, 5).forEach((imp) => {
      doc.fillColor('#f59e0b').fontSize(11).text('→', 325, rightY);
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(imp, 345, rightY, { width: colWidth, lineGap: 2 });
      rightY = doc.y + 15; // Move next item down based on where previous ended
    });
    
    // Reset cursor to the bottom of the longest list
    doc.y = Math.max(leftY, rightY) + 20;
    
    // Feedback
    doc.addPage();
    doc.rect(0, 0, 595, 50).fill('#0f172a');
    doc.fillColor('#a5b4fc').fontSize(16).font('Helvetica-Bold').text('Session Feedback & Q&A Review', 50, 15);
    
    if (report.overallFeedback) {
      doc.fillColor('#0369a1').fontSize(12).font('Helvetica-Bold').text('Mentor Feedback', 65, 75);
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica')
        .text(report.overallFeedback, 65, 92, { width: 465, lineGap: 4 });
      
      const feedbackHeight = doc.y - 75 + 10;
      doc.rect(50, 70, 495, Math.max(80, feedbackHeight)).fill('#f0f9ff').stroke('#bae6fd');
      // Re-render text over the rectangle
      doc.fillColor('#0369a1').fontSize(12).font('Helvetica-Bold').text('Mentor Feedback', 65, 75);
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica')
        .text(report.overallFeedback, 65, 92, { width: 465, lineGap: 4 });
      doc.moveDown(2);
    }
    
    // Q&A summary
    if (answers && answers.length > 0) {
      const startQaY = Math.max(doc.y + 20, 170);
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Question & Answer Summary', 50, startQaY);
      doc.moveDown(1);
      
      answers.slice(0, 5).forEach((answer, i) => {
        const currentY = doc.y;
        const question = questions?.find(q => q._id?.toString() === answer.question?.toString());
        
        // Measure heights
        const qText = question ? (question.questionText?.substring(0, 120) + (question.questionText?.length > 120 ? '...' : '')) : '';
        const aText = 'Your answer: ' + (answer.answerText?.substring(0, 100) || '') + '...';
        
        doc.fillColor('#6366f1').fontSize(10).font('Helvetica-Bold').text(`Q${i + 1} · ${answer.score || 0}%`, 65, currentY + 12);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(qText, 65, currentY + 28, { width: 465 });
        doc.fillColor('#64748b').fontSize(9).text(aText, 65, doc.y + 8, { width: 465 });
        
        const cardHeight = doc.y - currentY + 15;
        doc.rect(50, currentY + 5, 495, cardHeight).fill('#f8fafc').stroke('#e2e8f0');
        
        // Re-render over rectangle
        doc.fillColor('#6366f1').fontSize(10).font('Helvetica-Bold').text(`Q${i + 1} · ${answer.score || 0}%`, 65, currentY + 12);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(qText, 65, currentY + 28, { width: 465 });
        doc.fillColor('#64748b').fontSize(9).text(aText, 65, doc.y + 8, { width: 465 });
        
        doc.moveDown(1);
      });
    }
    
    // Footer on last page
    doc.fontSize(9).fillColor('#94a3b8')
      .text('Generated by AI Mentor Platform · Confidential Performance Report', 50, 750, { align: 'center', width: 495 });
    
    doc.end();
    
    stream.on('finish', () => resolve({ filename, filepath: `/reports/${filename}` }));
    stream.on('error', reject);
  });
}

function getScoreLabel(score) {
  if (score >= 90) return 'Outstanding Performance';
  if (score >= 80) return 'Excellent Performance';
  if (score >= 70) return 'Good Performance';
  if (score >= 60) return 'Satisfactory Performance';
  return 'Needs Improvement';
}

module.exports = { generatePDFReport };