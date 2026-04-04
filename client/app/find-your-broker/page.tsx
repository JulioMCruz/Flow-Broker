"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { QuizStep } from "@/components/broker/quiz-step"
import { QuizResults } from "@/components/broker/quiz-results"
import { Progress } from "@/components/ui/progress"

const questions = [
  {
    id: 1,
    question: "What's your main goal?",
    options: [
      { id: "a", label: "Protect my money and grow slowly", score: 1 },
      { id: "b", label: "Balance growth and security", score: 2 },
      { id: "c", label: "Maximize returns, I can handle volatility", score: 3 },
    ],
  },
  {
    id: 2,
    question: "How long can you leave your money invested?",
    options: [
      { id: "a", label: "Less than 1 year", score: 1 },
      { id: "b", label: "1 to 5 years", score: 2 },
      { id: "c", label: "More than 5 years", score: 3 },
    ],
  },
  {
    id: 3,
    question: "Your portfolio drops 20% in a week. What do you do?",
    options: [
      { id: "a", label: "I'd sell everything immediately", score: 1 },
      { id: "b", label: "I'd wait and see", score: 2 },
      { id: "c", label: "I'd buy more — great opportunity", score: 3 },
    ],
  },
  {
    id: 4,
    question: "How would you describe your investing experience?",
    options: [
      { id: "a", label: "Complete beginner", score: 1 },
      { id: "b", label: "I've bought some stocks or crypto", score: 2 },
      { id: "c", label: "I actively manage a portfolio", score: 3 },
    ],
  },
  {
    id: 5,
    question: "How much can you invest per month?",
    options: [
      { id: "a", label: "Less than $500", score: 1 },
      { id: "b", label: "$500 to $5,000", score: 2 },
      { id: "c", label: "More than $5,000", score: 3 },
    ],
  },
]

export default function FindYourBrokerPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)

  const handleAnswer = (questionId: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }))

    // Move to next step or show results
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep((prev) => prev + 1)
      } else {
        setShowResults(true)
      }
    }, 300)
  }

  const calculateScore = () => {
    const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0)
    const maxScore = questions.length * 3
    const percentage = (totalScore / maxScore) * 100

    // Map to 8 brokers based on score percentage
    if (percentage <= 20) return "guardian"
    if (percentage <= 30) return "sentinel"
    if (percentage <= 45) return "steady"
    if (percentage <= 55) return "navigator"
    if (percentage <= 65) return "growth"
    if (percentage <= 75) return "momentum"
    if (percentage <= 87) return "apex"
    return "titan"
  }

  const resetQuiz = () => {
    setCurrentStep(0)
    setAnswers({})
    setShowResults(false)
  }

  const progress = ((currentStep + 1) / questions.length) * 100
  const currentQuestion = questions[currentStep]

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-16 min-h-screen flex flex-col">
        {!showResults && currentQuestion ? (
          <div className="flex-1 flex flex-col">
            <div className="max-w-2xl mx-auto w-full px-4 pt-8">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Step {currentStep + 1} of {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              <QuizStep
                key={currentStep}
                question={currentQuestion}
                selectedAnswer={answers[currentQuestion.id]}
                onAnswer={(score) => handleAnswer(currentQuestion.id, score)}
              />
            </div>
          </div>
        ) : (
          <QuizResults result={calculateScore()} onReset={resetQuiz} />
        )}
      </div>

      <Footer />
    </main>
  )
}
