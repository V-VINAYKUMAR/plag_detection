import { useState, useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowDownRight, ArrowLeft, ArrowRight, Activity, BadgeCheck,
  Check, ChevronRight, CircleHelp, Clock3, Code2, FileImage,
  FileText, Github, History, Image as ImageIcon, LayoutDashboard,
  Menu, ScanSearch, ShieldCheck, Sparkles, UploadCloud, X,
  Zap, AlertCircle, RefreshCw, Copy, Trash2
} from 'lucide-react'
import CodeEditor from './CodeEditor'
import './App.css'

const detectors = [
  { id: 'text', name: 'Text detection', desc: 'Analyze essays, articles, paragraphs and written content.', icon: FileText, tag: 'NLP MODEL', color: 'mint' },
  { id: 'code', name: 'Code detection', desc: 'Inspect source code for patterns associated with AI-generated code.', icon: Code2, tag: 'CODE INTELLIGENCE', color: 'blue' },
  { id: 'image', name: 'Image detection', desc: 'Analyze an image using your trained image detection model.', icon: ImageIcon, tag: 'COMPUTER VISION', color: 'violet' },
]

function getScore(result) {
  if (!result || typeof result !== 'object') return null
  for (const key of ['ai_confidence', 'confidence', 'ai_probability', 'probability', 'score']) {
    const value = result[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(100, value <= 1 ? value * 100 : value))
    }
  }
  return null
}

function getVerdict(result) {
  if (!result || typeof result !== 'object') return 'Analysis complete'
  const value = String(
    result.prediction ?? result.label ?? result.verdict ??
    result.classification ?? result.result ?? ''
  ).toLowerCase()

  if (value.includes('human')) return 'Likely human-written'
  if (value.includes('ai') || value.includes('artificial')) return 'Likely AI-generated'
  if (value.includes('fake') || value.includes('synthetic')) return 'Potentially AI-generated'
  if (value.includes('real') || value.includes('authentic')) return 'Potentially authentic'
  return 'Analysis complete'
}


function readableLabel(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function readableValue(value) {
  if (value === null || value === undefined || value === '') return 'Not provided'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'Not available'
  }
  if (Array.isArray(value)) {
    return value.length ? value.map(item =>
      typeof item === 'object' && item !== null
        ? JSON.stringify(item)
        : String(item)
    ).join(', ') : 'None'
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function getReadableEntries(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return []
  return Object.entries(result).filter(([key, value]) =>
    !['debug', 'stack_trace'].includes(key.toLowerCase()) &&
    value !== undefined &&
    value !== null
  )
}


function ResultPanel({ result, detector, onReset }) {
  const [showReport, setShowReport] = useState(false)
  const [showRawJson, setShowRawJson] = useState(false)

  useEffect(() => {
    if (showReport) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.querySelector('.full-report-screen')?.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      })
    }
  }, [showReport])
  const entries = getReadableEntries(result)
  const detectorType = detector.toLowerCase()
  const isImage = detectorType.includes('image')
  const isCode = detectorType.includes('code')

  const prediction = String(
    result?.prediction ?? result?.label ?? result?.verdict ??
    result?.classification ?? result?.result ?? ''
  ).toLowerCase()

  const isHumanPrediction =
    prediction.includes('human') ||
    (isImage && (prediction.includes('real') || prediction.includes('authentic')))

  const isAIPrediction =
    prediction.includes('ai') ||
    prediction.includes('artificial') ||
    prediction.includes('fake') ||
    prediction.includes('synthetic')

  const toPercent = value => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    // Backend returns probability values already multiplied by 100.
    return Math.max(0, Math.min(100, value))
  }

  const formatScore = value => {
    const number = toPercent(value)
    return number === null ? null : `${Number(number.toFixed(2))}%`
  }

  // Map each detector's actual response fields.
  const aiProbability = toPercent(
    isCode ? result?.ai_confidence : result?.ai_probability
  )

  const humanProbability = toPercent(
    isImage
      ? result?.real_probability
      : isCode
        ? result?.human_confidence
        : result?.human_probability
  )

  // Show the probability corresponding to the predicted class.
  const score = isHumanPrediction
    ? (humanProbability ?? toPercent(result?.confidence))
    : isAIPrediction
      ? (aiProbability ?? toPercent(result?.confidence))
      : toPercent(result?.confidence) ?? toPercent(result?.score)

  const scoreLabel = isHumanPrediction
    ? (isImage ? 'Real score' : 'Human score')
    : isAIPrediction
      ? 'AI score'
      : 'Model confidence'

  const verdict = isImage
    ? (prediction === 'real' ? 'Likely real / authentic'
      : isAIPrediction ? 'Potentially AI-generated'
      : result?.prediction ?? result?.label ?? 'Analysis complete')
    : getVerdict(result)

  const aiScore = formatScore(aiProbability)
  const humanScore = formatScore(humanProbability)

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    } catch {
      window.alert('Unable to copy. You can expand the raw response and copy it manually.')
    }
  }

  return (
    <>
      <section className="result-panel" aria-live="polite">
        <div className="result-topline">
          <span className="eyebrow"><span className="status-dot" /> ANALYSIS COMPLETE</span>
          <span className="result-chip"><ShieldCheck size={15} /> {detector}</span>
        </div>

        <div className="verdict-card">
          <div className="verdict-icon"><BadgeCheck size={27} /></div>
          <div className="verdict-copy">
            <span className="eyebrow">MODEL VERDICT</span>
            <h3>{verdict}</h3>
            <p>{isImage
                ? 'The AI probability and real-image probability are shown separately below.'
                : 'Review the prediction and its available supporting output.'}</p>
          </div>
          {score !== null && (
            <div className="score-ring" style={{ '--score': `${score}%` }}>
              <div><strong>{Number(score.toFixed(1))}%</strong><span>{scoreLabel}</span></div>
            </div>
          )}
        </div>

        <button className="button-primary view-full-report" onClick={() => setShowReport(true)}>
          <FileText size={17} /> View Detailed Analysis <ArrowRight size={17} />
        </button>
      </section>

      {showReport && (
        <div className="full-report-screen">
          <header className="full-report-nav">
            <button type="button" className="report-back-button" onClick={() => {
                setShowReport(false)
                if (detector.toLowerCase().includes('image')) {
                  onReset()
                }
              }} style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
              <ArrowLeft size={17} /> Back to results
            </button>
            <a className="brand" href="#report-top" onClick={e => e.preventDefault()}>
              <span className="brand-mark"><ScanSearch size={21} /></span>
              <span className="brand-name">Veri<span>Scan</span></span>
              <span className="brand-badge">REPORT</span>
            </a>
            <button className="button-secondary report-copy-button" onClick={copyReport}>
              <Copy size={15} /> Copy report data
            </button>
          </header>

          <main id="report-top" className="full-report-content">
            <div className="report-breadcrumb">VERISCAN <ChevronRight size={13} /> ANALYSIS REPORT</div>

            <div className="full-report-title">
              <div>
                <span className="eyebrow"><span className="status-dot" /> ANALYSIS COMPLETE</span>
                <h1>Detailed <span className="gradient-text">Analysis</span></h1>
                <p>{isImage
                    ? 'Image prediction and probabilities returned by your image detection model.'
                    : `A structured view of the result returned by your ${detector.toLowerCase()} model.`}</p>
              </div>
              <div className="report-type-badge"><ShieldCheck size={16} /> {detector}</div>
            </div>

            <section className="report-verdict-large">
              <div className="report-verdict-main">
                <span className="report-verdict-icon"><BadgeCheck size={27} /></span>
                <div>
                  <span className="eyebrow">MODEL VERDICT</span>
                  <h2>{verdict}</h2>
                  <p>Predictions are estimates and should not be treated as definitive proof of authorship.</p>
                </div>
              </div>
              {score !== null && (
                <div className="report-score-large">
                  <div className="score-ring" style={{ '--score': `${score}%` }}>
                    <div><strong>{Number(score.toFixed(1))}%</strong><span>{scoreLabel}</span></div>
                  </div>
                  <span>Reported score</span>
                </div>
              )}
            </section>

            <div className="report-section-heading">
              <div><span className="eyebrow">MODEL METRICS</span><h2>Confidence overview</h2></div>
              <span className="report-muted">Only available scores are shown</span>
            </div>

            <div className="report-metric-grid">
              <article className="report-metric-card">
                <span className="metric-icon mint"><Sparkles size={19} /></span>
                <span className="metric-label">AI probability / confidence</span>
                <strong>{aiScore ?? 'Not provided'}</strong>
                {aiScore || score !== null ? (
                  <div className="confidence-track"><span style={{ width: aiScore ?? `${score}%` }} /></div>
                ) : <p>This score was not returned by the model.</p>}
              </article>
              <article className="report-metric-card">
                <span className="metric-icon blue"><ShieldCheck size={19} /></span>
                <span className="metric-label">{isImage ? 'Real-image probability' : isCode ? 'Human confidence' : 'Human probability'}</span>
                <strong>{humanScore ?? 'Not provided'}</strong>
                {humanScore ? (
                  <div className="confidence-track human-track"><span style={{ width: humanScore }} /></div>
                ) : <p>This score was not returned by the model.</p>}
              </article>
              <article className="report-metric-card">
                <span className="metric-icon violet"><Activity size={19} /></span>
                <span className="metric-label">Report fields</span>
                <strong>{entries.length}</strong>
                <p>Fields received in the model response.</p>
              </article>
            </div>

            <section className="report-details-section">
              <div className="report-section-heading">
                <div><span className="eyebrow">RESPONSE BREAKDOWN</span><h2>Detailed findings</h2></div>
                <span className="report-count">{entries.length} fields</span>
              </div>
              {entries.length ? (
                <div className="report-findings-list">
                  {entries.map(([key, value]) => (
                    <article className="report-finding" key={key}>
                      <div className="finding-label">{readableLabel(key)}</div>
                      <div className="finding-value">{readableValue(value)}</div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="report-empty-state">
                  <FileText size={24} />
                  <h3>No additional details returned</h3>
                  <p>Your model returned no extra fields to display in this section.</p>
                </div>
              )}
            </section>

            <section className="report-technical-section">
              <button className="technical-toggle" onClick={() => setShowRawJson(value => !value)} aria-expanded={showRawJson}>
                <span><Code2 size={17} /> Technical response (JSON)</span>
                <ChevronRight size={17} className={showRawJson ? 'rotate-chevron' : ''} />
              </button>
              {showRawJson && (
                <div className="technical-response">
                  <div className="technical-response-bar"><span>MODEL RESPONSE</span><button className="text-button" onClick={copyReport}><Copy size={14} /> Copy JSON</button></div>
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </section>

            <div className="report-disclaimer">
              <ShieldCheck size={18} />
              <p><strong>Interpret results carefully.</strong> AI detectors can make mistakes. These findings reflect the response from your current model and are not independent verification of content origin.</p>
            </div>

            <div className="report-bottom-actions">
              <button type="button" className="button-secondary" onClick={() => {
                setShowReport(false)
                if (detector.toLowerCase().includes('image')) {
                  onReset()
                }
              }} style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}><ArrowLeft size={16} /> Back to results</button>
              <button className="button-primary" onClick={onReset}><RefreshCw size={16} /> New analysis <ArrowRight size={16} /></button>
            </div>
          </main>
        </div>
      )}
    </>
  )
}

function App() {
  const prefersReducedMotion = useReducedMotion()
  const [activeDetector, setActiveDetector] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [codeLanguage, setCodeLanguage] = useState('cpp')
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [recentScans, setRecentScans] = useState([])

  const active = detectors.find(item => item.id === activeDetector)

  function openDetector(id) {
    setActiveDetector(id)
    setResult(null)
    setError('')
    setMenuOpen(false)
    document.getElementById('app-main')?.scrollIntoView({ behavior: 'smooth' })
  }

  function resetWorkspace() {
    setResult(null)
    setError('')
    setTextInput('')
    setCodeInput('')
    setImageFile(null)
    const fileInput = document.getElementById('image-upload')
    if (fileInput) fileInput.value = ''
  }

  async function runDetection(event) {
    event.preventDefault()
    if (!activeDetector || loading) return

    if (activeDetector === 'image' && !imageFile) {
      setError('Choose an image before starting your analysis.')
      return
    }
    if (activeDetector === 'text' && !textInput.trim()) {
      setError('Enter some text before starting your analysis.')
      return
    }
    if (activeDetector === 'code' && !codeInput.trim()) {
      setError('Enter some code before starting your analysis.')
      return
    }

    setLoading(true)
    setResult(null)
    setError('')

    try {
      let response

      if (activeDetector === 'image') {
        const body = new FormData()
        body.append('file', imageFile)
        response = await fetch('http://127.0.0.1:8000/api/detect/image', {
          method: 'POST',
          body
        })
      } else {
        const endpoint = activeDetector === 'text' ? 'text' : 'code'
        const payload = activeDetector === 'text'
          ? { text: textInput }
          : { code: codeInput }

        response = await fetch(`http://127.0.0.1:8000/api/detect/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : `Request failed (${response.status})`)
      }

      setResult(data)
      setRecentScans(previous => [
        {
          id: `${Date.now()}-${Math.random()}`,
          type: activeDetector,
          name: activeDetector === 'image' ? imageFile.name : `${active.name} scan`,
          verdict: getVerdict(data),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...previous
      ].slice(0, 5))
    } catch (err) {
      setError(err.message || 'Detection failed. Check that your backend is running at 127.0.0.1:8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="navbar">
        <a className="brand" href="#home" onClick={() => { setActiveDetector(null); setMenuOpen(false) }}>
          <span className="brand-mark"><ScanSearch size={22} /></span>
          <span className="brand-name">Veri<span>Scan</span></span>
          <span className="brand-badge">AI</span>
        </a>
        <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          <a href="#home" onClick={() => { setActiveDetector(null); setMenuOpen(false) }}>Overview</a>
          <a href="#detectors" onClick={() => setMenuOpen(false)}>Detectors</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        </nav>
        <button className="button-primary nav-action" onClick={() => document.getElementById('detectors')?.scrollIntoView({ behavior: 'smooth' })}>
          Start a scan <ArrowRight size={16} />
        </button>
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <main id="app-main">
        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeDetector || 'overview'}
          initial={prefersReducedMotion ? false : { opacity: 0, x: 18, y: 6, filter: 'blur(3px)' }}
          animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12, y: -3, filter: 'blur(2px)' }}
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
        {!activeDetector ? (
          <>
            <section id="home" className="hero page-width">
              <div className="hero-copy">
                <div className="hero-pill"><span className="status-dot" /> YOUR CONTENT. YOUR CLARITY.</div>
                <h1>Know what&apos;s real.<br /><span className="gradient-text">See beyond the surface.</span></h1>
                <p className="hero-description">
                  One workspace to analyze text, source code, and images with your AI detection models.
                  Get a prediction and inspect the model&apos;s response in one place.
                </p>
                <div className="hero-actions">
                  <button className="button-primary" onClick={() => document.getElementById('detectors')?.scrollIntoView({ behavior: 'smooth' })}>
                    Explore detectors <ArrowRight size={17} />
                  </button>
                  <a className="button-secondary" href="#how-it-works">How it works <ArrowDownRight size={16} /></a>
                </div>
                <div className="hero-trust">
                  <span><ShieldCheck size={16} /> Three detection modes</span>
                  <span><Zap size={16} /> Direct model inference</span>
                </div>
              </div>

              <div className="hero-visual" aria-label="VeriScan detection overview">
                <div className="visual-topbar"><span><i /> VERISCAN / SYSTEM OVERVIEW</span><span className="live-label">● READY</span></div>
                <div className="visual-orbit">
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
                  <div className="orbit-core"><ScanSearch size={37} /><span>VERIFY</span></div>
                  <div className="orbit-node node-one"><FileText size={17} /></div>
                  <div className="orbit-node node-two"><Code2 size={17} /></div>
                  <div className="orbit-node node-three"><ImageIcon size={17} /></div>
                </div>
                <div className="visual-stats">
                  <div><span>Detection modes</span><strong>03</strong></div>
                  <div><span>Analysis engine</span><strong className="mint-text">ACTIVE</strong></div>
                </div>
                <div className="visual-foot"><span><Activity size={14} /> READY FOR ANALYSIS</span><span>VERISCAN v1.0</span></div>
              </div>
            </section>

            <section id="detectors" className="detectors-section page-width">
              <div className="section-heading">
                <div><span className="eyebrow">THE DETECTION SUITE</span><h2>Choose your <span className="gradient-text">analysis.</span></h2></div>
                <p>Choose a detector to open its dedicated workspace.</p>
              </div>
              <div className="detector-grid">
                {detectors.map((detector, index) => {
                  const Icon = detector.icon
                  return (
                    <motion.button
                      key={detector.id}
                      className={`detector-card ${detector.color}`}
                      onClick={() => openDetector(detector.id)}
                      style={{ '--card-index': index }}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: prefersReducedMotion ? 0 : 0.08 * index }}
                      whileHover={prefersReducedMotion ? undefined : { y: -5, transition: { duration: 0.18 } }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                    >
                      <div className="card-top"><span className="detector-icon"><Icon size={22} /></span><span className="card-arrow"><ArrowUpRightIcon /></span></div>
                      <span className="eyebrow">{detector.tag}</span>
                      <h3>{detector.name}</h3>
                      <p>{detector.desc}</p>
                      <div className="card-bottom"><span>Open workspace</span><ChevronRight size={16} /></div>
                    </motion.button>
                  )
                })}
              </div>
              <div className="privacy-note"><LockIcon /> <span>Predictions depend on the model and input quality. A detector result is an estimate, not proof of authorship.</span></div>
            </section>

            <section id="how-it-works" className="how-section page-width">
              <div className="section-heading"><div><span className="eyebrow">SIMPLE BY DESIGN</span><h2>From input to <span className="gradient-text">insight.</span></h2></div></div>
              <div className="steps-grid">
                <div className="step-card"><span className="step-number">01</span><UploadCloud size={23} /><h3>Submit content</h3><p>Paste text or code, or upload an image for analysis.</p></div>
                <div className="step-card"><span className="step-number">02</span><ScanSearch size={23} /><h3>Run detection</h3><p>Your selected model analyzes the submitted input.</p></div>
                <div className="step-card"><span className="step-number">03</span><Activity size={23} /><h3>Review output</h3><p>Inspect the prediction and the actual response returned by the model.</p></div>
              </div>
            </section>
          </>
        ) : (
          <section className="workspace page-width">
            <button className="back-link" onClick={() => { setActiveDetector(null); setResult(null); setError('') }}><ArrowLeft size={16} /> Back to overview</button>
            <div className="workspace-heading">
              <div className={`workspace-icon ${active.color}`}><active.icon size={25} /></div>
              <div><span className="eyebrow">{active.tag}</span><h1>{active.name}</h1><p>{active.desc}</p></div>
            </div>

            <div className="workspace-layout">
              <div className="input-panel">
                <div className="panel-heading"><div><span className="eyebrow">INPUT</span><h2>Content to analyze</h2></div><span className="input-status"><span className="status-dot" /> READY</span></div>
                <form onSubmit={runDetection}>
                  {activeDetector === 'text' && (
                    <>
                      <textarea className="content-textarea" value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Paste your text here..." rows={13} maxLength={50000} />
                      <div className="input-footer"><span>{textInput.length.toLocaleString()} characters</span><button type="button" className="text-button" onClick={() => setTextInput('')}><Trash2 size={14} /> Clear</button></div>
                    </>
                  )}
                  {activeDetector === 'code' && (
                    <>
                      <label className="field-label" htmlFor="code-language">Programming language</label>
                      <select id="code-language" className="language-select" value={codeLanguage} onChange={e => setCodeLanguage(e.target.value)}>
                        <option value="cpp">C++</option><option value="java">Java</option><option value="python">Python</option><option value="javascript">JavaScript</option>
                      </select>
                      <div className="editor-frame"><CodeEditor value={codeInput} onChange={setCodeInput} language={codeLanguage} /></div>
                      <div className="input-footer"><span>{codeInput.length.toLocaleString()} characters</span><button type="button" className="text-button" onClick={() => setCodeInput('')}><Trash2 size={14} /> Clear</button></div>
                    </>
                  )}
                  {activeDetector === 'image' && (
                    <div className="image-upload-area">
                      <label className="upload-zone" htmlFor="image-upload" onDragOver={e => e.preventDefault()} onDrop={e => {
                        e.preventDefault()
                        const file = e.dataTransfer.files?.[0]
                        if (file?.type.startsWith('image/')) setImageFile(file)
                        else setError('Please choose a valid image file.')
                      }}>
                        {imageFile ? (
                          <div className="image-preview">
                            <img src={URL.createObjectURL(imageFile)} alt="Image selected for analysis" />
                            <strong>{imageFile.name}</strong><span>{(imageFile.size / 1024).toFixed(1)} KB · Ready to analyze</span>
                          </div>
                        ) : (
                          <><span className="upload-icon"><UploadCloud size={27} /></span><strong>Drop your image here</strong><span>or <em>browse files</em></span><small>PNG, JPG, WEBP · Maximum 10 MB</small></>
                        )}
                        <input id="image-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { setImageFile(e.target.files?.[0] || null); setError('') }} />
                      </label>
                      {imageFile && <button type="button" className="text-button remove-file" onClick={() => setImageFile(null)}><Trash2 size={14} /> Remove image</button>}
                    </div>
                  )}
                  {error && <div className="error-message" role="alert"><AlertCircle size={17} /> {error}</div>}
                  <button className="button-primary scan-button" type="submit" disabled={loading}>
                    {loading ? <><span className="spinner" /> Analyzing content...</> : <><ScanSearch size={18} /> Run detection <ArrowRight size={17} /></>}
                  </button>
                  <p className="form-disclaimer"><LockIcon /> Your input is sent to your configured local detection backend.</p>
                </form>
              </div>
              <aside className="workspace-aside">
                <div className="aside-card"><span className="aside-icon"><ShieldCheck size={20} /></span><h3>Model-based analysis</h3><p>Results reflect the prediction returned by your selected model. Accuracy varies by content and data.</p></div>
                <div className="aside-card"><span className="aside-icon"><CircleHelp size={20} /></span><h3>Need a better result?</h3><p>Use a clear, representative sample. Very short or heavily modified content can be difficult to classify.</p></div>
                <div className="aside-card mini-status"><span className="status-dot" /><div><strong>API connection</strong><span>Local backend · port 8000</span></div></div>
              </aside>
            </div>
            {result !== null && <ResultPanel result={result} detector={active.name} onReset={resetWorkspace} />}
          </section>
        )}
        </motion.div>
        </AnimatePresence>
      </main>

      <footer className="footer page-width">
        <a className="brand footer-brand" href="#home" onClick={() => setActiveDetector(null)}><span className="brand-mark"><ScanSearch size={19} /></span><span className="brand-name">Veri<span>Scan</span></span></a>
        <span>AI detection, made clearer.</span>
        <span className="footer-right"><span className="status-dot" /> Built for responsible analysis</span>
      </footer>
    </div>
  )
}

function ArrowUpRightIcon() {
  return <ArrowRight size={17} />
}
function LockIcon() {
  return <ShieldCheck size={15} />
}

export default App
