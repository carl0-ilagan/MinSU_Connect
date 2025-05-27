"use client"

import { Badge } from "@/components/ui/badge"

export function HobbiesStep({ formData, updateFormData, errors }) {
  const hobbyCategories = [
    {
      name: "Sports & Activities",
      hobbies: ["Basketball", "Volleyball", "Swimming", "Hiking", "Cycling", "Yoga", "Dancing"],
    },
    {
      name: "Arts & Creativity",
      hobbies: ["Painting", "Drawing", "Photography", "Writing", "Music", "Singing", "Crafting"],
    },
    {
      name: "Technology",
      hobbies: ["Programming", "Gaming", "Web Design", "Robotics", "3D Printing", "AI"],
    },
    {
      name: "Lifestyle",
      hobbies: ["Cooking", "Baking", "Gardening", "Reading", "Traveling", "Fashion", "Movies"],
    },
  ]

  const toggleHobby = (hobby) => {
    const currentHobbies = [...(formData.hobbies || [])]

    if (currentHobbies.includes(hobby)) {
      updateFormData({
        hobbies: currentHobbies.filter((i) => i !== hobby),
      })
    } else {
      updateFormData({
        hobbies: [...currentHobbies, hobby],
      })
    }
  }

  const isSelected = (hobby) => {
    return (formData.hobbies || []).includes(hobby)
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-right">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Your Hobbies</h3>
        <p className="text-sm text-muted-foreground">Select hobbies you enjoy (optional)</p>
      </div>

      {hobbyCategories.map((category) => (
        <div key={category.name} className="space-y-2">
          <h4 className="font-medium text-sm">{category.name}</h4>
          <div className="flex flex-wrap gap-2">
            {category.hobbies.map((hobby) => (
              <Badge
                key={hobby}
                variant={isSelected(hobby) ? "default" : "outline"}
                className={`cursor-pointer hover:bg-primary/90 transition-colors ${
                  isSelected(hobby) ? "bg-primary text-primary-foreground" : "hover:text-primary-foreground"
                }`}
                onClick={() => toggleHobby(hobby)}
              >
                {hobby}
              </Badge>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Selected Hobbies ({(formData.hobbies || []).length})</h4>
        <div className="flex flex-wrap gap-2">
          {(formData.hobbies || []).length > 0 ? (
            (formData.hobbies || []).map((hobby) => (
              <Badge key={hobby} variant="secondary" className="bg-primary/20 text-primary">
                {hobby}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No hobbies selected yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
