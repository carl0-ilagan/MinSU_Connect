"use client"

import { Badge } from "@/components/ui/badge"
import { XCircle } from "lucide-react"

export function InterestsStep({ formData, updateFormData, errors }) {
  const interestCategories = [
    {
      name: "Health & Wellness",
      interests: ["Mental Health", "Physical Health", "Nutrition", "Fitness", "Meditation", "Yoga"],
    },
    {
      name: "Support & Community",
      interests: ["Support Groups", "Caregiving", "Patient Stories", "Advocacy", "Research"],
    },
    {
      name: "Lifestyle",
      interests: ["Family", "Work-Life Balance", "Travel", "Hobbies", "Cooking", "Reading"],
    },
    {
      name: "Education & Resources",
      interests: ["Medical Information", "Treatment Options", "Clinical Trials", "Healthcare Tips"],
    },
  ]

  const toggleInterest = (interest) => {
    const currentInterests = [...(formData.interests || [])]

    if (currentInterests.includes(interest)) {
      updateFormData({
        interests: currentInterests.filter((i) => i !== interest),
      })
    } else {
      updateFormData({
        interests: [...currentInterests, interest],
      })
    }
  }

  const isSelected = (interest) => {
    return (formData.interests || []).includes(interest)
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-right">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Your Interests</h3>
        <p className="text-sm text-muted-foreground">
          Select topics you're interested in to personalize your experience
        </p>
      </div>

      {interestCategories.map((category) => (
        <div key={category.name} className="space-y-2">
          <h4 className="font-medium text-sm">{category.name}</h4>
          <div className="flex flex-wrap gap-2">
            {category.interests.map((interest) => (
              <Badge
                key={interest}
                variant={isSelected(interest) ? "default" : "outline"}
                className={`cursor-pointer hover:bg-primary/90 transition-colors ${
                  isSelected(interest) ? "bg-primary text-primary-foreground" : "hover:text-primary-foreground"
                }`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      ))}

      {errors.interests && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <XCircle className="h-3 w-3" /> {errors.interests}
        </p>
      )}

      <div className="mt-4 bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Selected Interests ({(formData.interests || []).length})</h4>
        <div className="flex flex-wrap gap-2">
          {(formData.interests || []).length > 0 ? (
            (formData.interests || []).map((interest) => (
              <Badge key={interest} variant="secondary" className="bg-primary/20 text-primary">
                {interest}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No interests selected yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
