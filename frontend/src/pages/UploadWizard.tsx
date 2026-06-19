import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, CheckCircle2, RefreshCw, BarChart2, ChevronRight, 
  File, AlertTriangle, Play, Calendar, ListFilter, ArrowRight, Download 
} from "lucide-react"
import { 
  uploadDataset, validateDataset, trainModel, generateForecast, 
  getReportDownloadUrl 
} from "@/lib/api"
import { useNavigate } from "react-router-dom"

const steps = [
  { id: 1, title: "Upload Data", icon: Upload },
  { id: 2, title: "Validate & Clean", icon: RefreshCw },
  { id: 3, title: "Train Model", icon: BarChart2 },
  { id: 4, title: "Forecast Ready", icon: CheckCircle2 }
]

export function UploadWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  
  // Data states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [datasetId, setDatasetId] = useState<number | null>(null)
  
  // Step 2 Validation states
  const [validationReport, setValidationReport] = useState<any>(null)
  
  // Step 3 Training states
  const [selectedModel, setSelectedModel] = useState("Auto Select Best Model")
  const [cleanMissing, setCleanMissing] = useState(true)
  const [removeOutliers, setRemoveOutliers] = useState(true)
  const [generateFeatures, setGenerateFeatures] = useState(true)
  const [trainingMetrics, setTrainingMetrics] = useState<any>(null)
  const [trainingStatusText, setTrainingStatusText] = useState("")

  // Step 4 Forecast states
  const [forecastHorizon, setForecastHorizon] = useState("90") // 7, 30, 90, 180, 365
  const [forecastFinished, setForecastFinished] = useState(false)

  const navigate = useNavigate()

  // Actions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      setErrorMsg("")
    }
  }

  const triggerUpload = async () => {
    if (!selectedFile) {
      setErrorMsg("Please select a file to upload first.")
      return
    }
    setIsProcessing(true)
    setErrorMsg("")
    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const res = await uploadDataset(formData)
      setDatasetId(res.data.dataset_id)
      setIsProcessing(false)
      setCurrentStep(2)
      
      // Proactively start validation for Step 2
      triggerValidation(res.data.dataset_id)
    } catch (err: any) {
      console.error(err)
      setIsProcessing(false)
      setErrorMsg(err.response?.data?.detail || "Failed to upload the dataset file. Please check file structure.")
    }
  }

  const triggerValidation = async (id: number) => {
    setIsProcessing(true)
    try {
      const res = await validateDataset(id)
      setValidationReport(res.data)
      setIsProcessing(false)
    } catch (err: any) {
      console.error(err)
      setIsProcessing(false)
      setErrorMsg("Failed to validate dataset.")
    }
  }

  const triggerTraining = async () => {
    if (!datasetId) return
    setIsProcessing(true)
    setErrorMsg("")
    setTrainingStatusText("Cleaning dataset...")
    
    // Simulate a status rotation for premium feel
    const statusInterval = setInterval(() => {
      setTrainingStatusText(prev => {
        if (prev === "Cleaning dataset...") return "Capping outliers..."
        if (prev === "Capping outliers...") return "Generating calendar & lag features..."
        if (prev === "Generating calendar & lag features...") return "Training machine learning algorithms..."
        return "Optimizing validation scoring..."
      })
    }, 1500)

    try {
      const res = await trainModel({
        dataset_id: datasetId,
        model_type: selectedModel,
        clean_missing: cleanMissing,
        remove_outliers: removeOutliers,
        generate_features: generateFeatures
      })
      clearInterval(statusInterval)
      setTrainingMetrics(res.data)
      setIsProcessing(false)
      setCurrentStep(4)
    } catch (err: any) {
      clearInterval(statusInterval)
      console.error(err)
      setIsProcessing(false)
      setErrorMsg(err.response?.data?.detail || "Model training failed. Make sure dataset rows count is sufficient.")
    }
  }

  const triggerForecast = async () => {
    if (!datasetId) return
    setIsProcessing(true)
    setErrorMsg("")
    try {
      await generateForecast({
        dataset_id: datasetId,
        horizon_days: parseInt(forecastHorizon)
      })
      setIsProcessing(false)
      setForecastFinished(true)
    } catch (err: any) {
      console.error(err)
      setIsProcessing(false)
      setErrorMsg("Failed to generate demand forecasts.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Forecasting Wizard</h2>
          <p className="text-muted-foreground mt-2">Generate AI-powered forecasts, optimize stock levels, and dynamically generate insights.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/")}>
          Cancel
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8 relative px-4">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10 -translate-y-1/2" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500 ease-in-out" 
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }} 
        />
        
        {steps.map((step) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = step.id < currentStep
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isActive ? 'border-primary bg-background text-primary ring-4 ring-primary/20 scale-110 font-bold' : 
                isCompleted ? 'border-primary bg-primary text-primary-foreground' : 
                'border-muted bg-background text-muted-foreground'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`mt-2 text-xs font-semibold ${isActive ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                {step.title}
              </span>
            </div>
          )
        })}
      </div>

      {/* Main Alert for Errors */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm flex gap-3 items-center">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Content Card */}
      <Card className="min-h-[460px] flex flex-col relative overflow-hidden bg-card/60 backdrop-blur-md border-muted/50 shadow-xl">
        <CardContent className="flex-1 p-8 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Upload Dataset */}
            {currentStep === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                className="space-y-6 flex flex-col items-center text-center w-full"
              >
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center bg-primary/5 text-primary hover:bg-primary/10 transition-colors duration-300 cursor-pointer">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Upload Dataset</h3>
                  <p className="text-muted-foreground mt-2 text-sm max-w-lg">
                    Supported formats: <strong>CSV, XLSX</strong>. Column names must include: Date, Product_ID, Product_Name, Category, Units_Sold, Price, Revenue, Inventory_Level.
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <label className="cursor-pointer bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-all shadow-md inline-flex items-center gap-2">
                    <File className="w-4 h-4" />
                    Browse Files
                    <input 
                      type="file" 
                      accept=".csv, .xlsx, .xls" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                  
                  {selectedFile && (
                    <div className="p-3 bg-secondary rounded-lg border border-border text-sm font-medium flex items-center gap-2 max-w-md">
                      <File className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>

                <div className="w-full max-w-sm pt-4 border-t">
                  <Button 
                    className="w-full flex items-center justify-center gap-2" 
                    onClick={triggerUpload} 
                    disabled={!selectedFile || isProcessing}
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Upload & Validate
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Validate & Preview */}
            {currentStep === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                className="space-y-6 w-full text-left"
              >
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <File className="w-5 h-5 text-primary" />
                      Dataset Verification
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Verification details & preview of the uploaded file</p>
                  </div>
                  {isProcessing ? (
                    <Badge variant="outline" className="animate-pulse">Validating...</Badge>
                  ) : (
                    <div className="flex gap-2">
                      <div className="text-xs font-semibold px-2.5 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                        {validationReport?.total_rows} Rows
                      </div>
                      <div className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                        {validationReport?.total_products} Products
                      </div>
                    </div>
                  )}
                </div>

                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-sm font-medium">Validating columns and checking row metrics...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Validation Checks */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-3.5 bg-background border rounded-lg flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold">Missing Values</span>
                        <span className={`text-lg font-bold mt-1 ${validationReport && (Object.values(validationReport.missing_values) as number[]).reduce((a, b) => a + b, 0) > 0 ? "text-yellow-500" : "text-green-500"}`}>
                          {validationReport ? (Object.values(validationReport.missing_values) as number[]).reduce((a, b) => a + b, 0) : 0} detected
                        </span>
                      </div>
                      <div className="p-3.5 bg-background border rounded-lg flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold">Invalid Dates</span>
                        <span className={`text-lg font-bold mt-1 ${validationReport?.invalid_dates > 0 ? "text-red-500" : "text-green-500"}`}>
                          {validationReport?.invalid_dates} rows
                        </span>
                      </div>
                      <div className="p-3.5 bg-background border rounded-lg flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold">Duplicate Rows</span>
                        <span className={`text-lg font-bold mt-1 ${validationReport?.duplicate_records > 0 ? "text-yellow-500" : "text-green-500"}`}>
                          {validationReport?.duplicate_records} rows
                        </span>
                      </div>
                      <div className="p-3.5 bg-background border rounded-lg flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold">Date Horizon</span>
                        <span className="text-sm font-bold mt-2 truncate text-foreground">
                          {validationReport?.date_range ? `${validationReport.date_range.start} to ${validationReport.date_range.end}` : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div>
                      <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5 text-foreground/90">
                        <ListFilter className="w-4 h-4 text-primary" />
                        Preview Dataset (First 20 rows)
                      </h4>
                      <div className="overflow-x-auto w-full max-h-[220px] border border-border/80 rounded-lg shadow-inner bg-background/50">
                        <table className="w-full border-collapse">
                          <thead className="bg-muted/80 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                              {validationReport?.preview_data && validationReport.preview_data.length > 0 && 
                                Object.keys(validationReport.preview_data[0]).map((h, i) => (
                                  <th key={i} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b text-left uppercase tracking-wider">
                                    {h}
                                  </th>
                                ))
                              }
                            </tr>
                          </thead>
                          <tbody>
                            {validationReport?.preview_data?.map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                                {Object.values(row).map((val: any, cIdx: number) => (
                                  <td key={cIdx} className="px-4 py-2 text-sm text-foreground/90 border-b border-muted/30 text-left whitespace-nowrap">
                                    {val === null || val === undefined ? <span className="text-muted-foreground italic">null</span> : val.toString()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={() => setCurrentStep(1)}>
                        Upload Different File
                      </Button>
                      <Button onClick={() => setCurrentStep(3)} className="flex items-center gap-2">
                        Proceed to Model Selection
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Model Selector & Hyperparameters */}
            {currentStep === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                className="space-y-6 w-full text-left"
              >
                <div className="pb-4 border-b">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    Model Hyperparameters
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Choose your algorithm and adjust parameters before training</p>
                </div>

                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                    <div className="text-center space-y-1.5">
                      <span className="text-sm font-semibold text-foreground">Training AI Algorithms...</span>
                      <p className="text-xs text-muted-foreground animate-pulse">{trainingStatusText}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Model Select */}
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-foreground/90 block">Select Forecasting Model</label>
                        <select 
                          className="w-full p-2.5 rounded-lg border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                        >
                          <option value="Auto Select Best Model">Auto Select Best Model (Compare All)</option>
                          <option value="XGBoost">XGBoost Regressor</option>
                          <option value="LightGBM">LightGBM Regressor</option>
                          <option value="Random Forest">Random Forest Regressor</option>
                          <option value="Prophet">Facebook Prophet</option>
                        </select>
                        <p className="text-xs text-muted-foreground leading-normal">
                          Auto Select evaluates XGBoost, LightGBM, Random Forest, and Prophet on validation sets and keeps the best performing model per product.
                        </p>
                      </div>

                      {/* Right: Data Toggles */}
                      <div className="space-y-4 p-4 border rounded-lg bg-background/50">
                        <label className="text-sm font-bold text-foreground block">Dataset Preprocessing Options</label>
                        <div className="space-y-3.5 mt-2">
                          <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={cleanMissing} 
                              onChange={(e) => setCleanMissing(e.target.checked)}
                              className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                            />
                            <div>
                              <span className="font-semibold block">Missing Value Imputation</span>
                              <span className="text-xs text-muted-foreground">Fills missing dates and values using localized median.</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={removeOutliers} 
                              onChange={(e) => setRemoveOutliers(e.target.checked)}
                              className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                            />
                            <div>
                              <span className="font-semibold block">Outlier Detection & Capping</span>
                              <span className="text-xs text-muted-foreground">Identifies demand spikes using IQR and caps values.</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={generateFeatures} 
                              onChange={(e) => setGenerateFeatures(e.target.checked)}
                              className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                            />
                            <div>
                              <span className="font-semibold block">Automated Feature Engineering</span>
                              <span className="text-xs text-muted-foreground">Creates calendar, rolling averages, and lag variables.</span>
                            </div>
                          </label>
                        </div>
                      </div>

                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                      <Button variant="outline" onClick={() => setCurrentStep(2)}>
                        Back to Preview
                      </Button>
                      <Button onClick={triggerTraining} className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Train Model
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Generation Horizon & Success */}
            {currentStep === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 w-full text-center flex flex-col items-center"
              >
                {!forecastFinished ? (
                  <div className="space-y-6 w-full max-w-md">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto ring-4 ring-primary/5 animate-pulse">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Model Trained Successfully!</h3>
                      <p className="text-sm text-muted-foreground mt-1">AI models have been trained. Review validation parameters below.</p>
                    </div>

                    {/* Metrics Panel */}
                    <div className="grid grid-cols-3 gap-3 p-4 border rounded-xl bg-background text-left">
                      <div className="flex flex-col text-center">
                        <span className="text-xs font-semibold text-muted-foreground">Forecast Accuracy</span>
                        <span className="text-lg font-bold mt-1 text-green-500">{trainingMetrics?.accuracy?.toFixed(1)}%</span>
                      </div>
                      <div className="flex flex-col text-center border-x">
                        <span className="text-xs font-semibold text-muted-foreground">Mean Error (MAE)</span>
                        <span className="text-lg font-bold mt-1 text-foreground">{trainingMetrics?.mae?.toFixed(1)}</span>
                      </div>
                      <div className="flex flex-col text-center">
                        <span className="text-xs font-semibold text-muted-foreground">R² Coefficient</span>
                        <span className="text-lg font-bold mt-1 text-foreground">{trainingMetrics?.r2?.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Select forecasting horizon */}
                    <div className="space-y-3 text-left">
                      <label className="text-sm font-bold text-foreground">Select Forecast Horizon</label>
                      <select 
                        className="w-full p-2.5 rounded-lg border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                        value={forecastHorizon}
                        onChange={(e) => setForecastHorizon(e.target.value)}
                      >
                        <option value="7">Next 7 Days</option>
                        <option value="30">Next 30 Days</option>
                        <option value="90">Next 90 Days</option>
                        <option value="180">Next 6 Months</option>
                        <option value="365">Next 1 Year</option>
                      </select>
                    </div>

                    <div className="pt-4 border-t flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setCurrentStep(3)} disabled={isProcessing}>
                        Back to Options
                      </Button>
                      <Button onClick={triggerForecast} disabled={isProcessing} className="flex items-center gap-2 w-48 justify-center">
                        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Generate Forecast
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-lg">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground">Forecast Generated Successfully!</h3>
                      <p className="text-muted-foreground">
                        Your demand forecasts are compiled. Stock reorder points, AI insights, and analytics dashboard have been fully refreshed dynamically.
                      </p>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-3 w-full justify-center">
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 shadow-sm"
                        onClick={() => window.open(getReportDownloadUrl(datasetId || 1))}
                      >
                        <Download className="w-4 h-4" />
                        Download PDF Report
                      </Button>
                      <Button onClick={() => navigate("/")} className="flex items-center gap-2 shadow-md">
                        View Interactive Dashboard
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
