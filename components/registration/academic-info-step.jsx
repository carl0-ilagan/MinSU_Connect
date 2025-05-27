"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XCircle, GraduationCap, MapPin } from "lucide-react"

export function AcademicInfoStep({ formData, updateFormData, errors }) {
  const [filteredDepartments, setFilteredDepartments] = useState([])

  // Define campus options
  const campusOptions = [
    { value: "Main Campus", label: "Main Campus" },
    { value: "Calapan City Campus", label: "Calapan City Campus" },
    { value: "Bongabong Campus", label: "Bongabong Campus" },
  ]

  // Define all departments with their colleges and available campuses
  const allDepartments = [
    {
      college: "College of Agriculture and Allied Fields",
      departments: [
        {
          value: "Bachelor of Science in Agriculture",
          label: "Bachelor of Science in Agriculture",
          campuses: ["Main Campus"],
        },
        {
          value: "Bachelor of Science in Horticulture",
          label: "Bachelor of Science in Horticulture",
          campuses: ["Main Campus"],
        },
        {
          value: "Bachelor of Science in Agroforestry",
          label: "Bachelor of Science in Agroforestry",
          campuses: ["Main Campus"],
        },
      ],
    },
    {
      college: "College of Arts and Sciences",
      departments: [
        {
          value: "Bachelor of Arts in English Language",
          label: "Bachelor of Arts in English Language",
          campuses: ["Main Campus", "Calapan City Campus"],
        },
        {
          value: "Bachelor of Arts in Psychology",
          label: "Bachelor of Arts in Psychology",
          campuses: ["Calapan City Campus"],
        },
        {
          value: "Bachelor of Arts in Political Science",
          label: "Bachelor of Arts in Political Science",
          campuses: ["Bongabong Campus"],
        },
        {
          value: "Bachelor of Science in Environmental Science",
          label: "Bachelor of Science in Environmental Science",
          campuses: ["Main Campus"],
        },
      ],
    },
    {
      college: "College of Business and Management",
      departments: [
        {
          value: "Bachelor of Science in Entrepreneurship",
          label: "Bachelor of Science in Entrepreneurship",
          campuses: ["Main Campus"],
        },
        {
          value: "Bachelor of Science in Tourism Management",
          label: "Bachelor of Science in Tourism Management",
          campuses: ["Main Campus", "Calapan City Campus", "Bongabong Campus"],
        },
        {
          value: "Bachelor of Science in Hospitality Management",
          label: "Bachelor of Science in Hospitality Management",
          campuses: ["Calapan City Campus", "Bongabong Campus"],
        },
      ],
    },
    {
      college: "College of Computer Studies",
      departments: [
        {
          value: "Bachelor of Science in Information Technology",
          label: "Bachelor of Science in Information Technology",
          campuses: ["Main Campus", "Calapan City Campus", "Bongabong Campus"],
        },
        {
          value: "Bachelor of Science Computer Engineering",
          label: "Bachelor of Science Computer Engineering",
          campuses: ["Bongabong Campus"],
        },
      ],
    },
    {
      college: "College of Criminal Justice Education",
      departments: [
        {
          value: "Bachelor of Science in Criminology",
          label: "Bachelor of Science in Criminology",
          campuses: ["Calapan City Campus", "Bongabong Campus"],
        },
      ],
    },
    {
      college: "College of Teacher Education",
      departments: [
        {
          value: "Bachelor of Secondary Education",
          label: "Bachelor of Secondary Education",
          campuses: ["Main Campus", "Calapan City Campus", "Bongabong Campus"],
        },
        {
          value: "Bachelor of Elementary Education",
          label: "Bachelor of Elementary Education",
          campuses: ["Main Campus", "Bongabong Campus"],
        },
        {
          value: "Bachelor of Technical-Vocational Teacher Education",
          label: "Bachelor of Technical-Vocational Teacher Education",
          campuses: ["Calapan City Campus"],
        },
      ],
    },
    {
      college: "Institute of Agricultural and Biosystems Engineering",
      departments: [
        {
          value: "Bachelor of Agricultural and Biosystems Engineering",
          label: "Bachelor of Agricultural and Biosystems Engineering",
          campuses: ["Main Campus"],
        },
      ],
    },
    {
      college: "Institute of Fisheries",
      departments: [
        {
          value: "Bachelor of Science in Fisheries",
          label: "Bachelor of Science in Fisheries",
          campuses: ["Bongabong Campus"],
        },
      ],
    },
  ]

  // Filter departments based on selected campus
  useEffect(() => {
    if (formData.campus) {
      const filtered = allDepartments
        .map((college) => ({
          ...college,
          departments: college.departments.filter((dept) => dept.campuses.includes(formData.campus)),
        }))
        .filter((college) => college.departments.length > 0)

      setFilteredDepartments(filtered)
    } else {
      setFilteredDepartments([])
    }
  }, [formData.campus])

  const handleCampusChange = (value) => {
    updateFormData({ campus: value, department: "" }) // Reset department when campus changes
  }

  const handleDepartmentChange = (value) => {
    updateFormData({ department: value })
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Academic Information</h3>
        <p className="text-sm text-muted-foreground">Please provide your academic details</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="campus" className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Campus
          </Label>
          <Select value={formData.campus} onValueChange={handleCampusChange}>
            <SelectTrigger id="campus" className={`w-full ${errors.campus ? "border-red-500 ring-red-500" : ""}`}>
              <SelectValue placeholder="Select your campus" />
            </SelectTrigger>
            <SelectContent>
              {campusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.campus && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> {errors.campus}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department" className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            Department/Program
          </Label>
          <Select value={formData.department} onValueChange={handleDepartmentChange} disabled={!formData.campus}>
            <SelectTrigger
              id="department"
              className={`w-full ${errors.department ? "border-red-500 ring-red-500" : ""}`}
            >
              <SelectValue placeholder={formData.campus ? "Select your department/program" : "Select a campus first"} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {filteredDepartments.map((college) => (
                <div key={college.college}>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted">
                    {college.college}
                  </div>
                  {college.departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          {errors.department && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> {errors.department}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
