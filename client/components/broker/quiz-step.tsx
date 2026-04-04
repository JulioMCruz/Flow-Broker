"use client"

import { Card } from "@/components/ui/card"

interface QuizStepProps {
  question: {
    id: number
    question: string
    options: { id: string; label: string; score: number }[]
  }
  selectedAnswer?: number
  onAnswer: (score: number) => void
}

export function QuizStep({ question, selectedAnswer, onAnswer }: QuizStepProps) {
  return (
    <div className="max-w-2xl w-full mx-auto">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground text-center mb-8 text-balance">
        {question.question}
      </h2>

      <div className="space-y-4">
        {question.options.map((option) => (
          <Card
            key={option.id}
            onClick={() => onAnswer(option.score)}
            className={`p-6 cursor-pointer transition-all border-border hover:border-primary/50 ${
              selectedAnswer === option.score
                ? "border-primary bg-primary/5"
                : "bg-card hover:bg-card/80"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-sm font-mono text-muted-foreground uppercase">
                {option.id}
              </span>
              <span className="text-lg font-light text-foreground">
                {option.label}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
