"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Menu, X, Check, Users, ArrowUp, GraduationCap, BookOpen, Building2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function WelcomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const { user } = useAuth()
  const hasRedirected = useRef(false)

  // Create refs for each section
  const homeRef = useRef(null)
  const aboutRef = useRef(null)
  const featuresRef = useRef(null)
  const guidelinesRef = useRef(null)

  // Prevent automatic redirects
  useEffect(() => {
    if (user && !hasRedirected.current) {
      hasRedirected.current = true
    }
  }, [user])

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  // Handle scroll to section
  const scrollToSection = (sectionId) => {
    let ref
    switch (sectionId) {
      case "home":
        ref = homeRef
        break
      case "about":
        ref = aboutRef
        break
      case "features":
        ref = featuresRef
        break
      case "guidelines":
        ref = guidelinesRef
        break
      default:
        ref = homeRef
    }

    if (ref && ref.current) {
      // Close menu if open
      if (menuOpen) setMenuOpen(false)

      // Scroll to section with smooth behavior
      window.scrollTo({
        top: ref.current.offsetTop - 80, // Adjust for header height
        behavior: "smooth",
      })
    }
  }

  // Handle scroll events to update active section
  useEffect(() => {
    const handleScroll = () => {
      // Show/hide scroll to top button
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }

      // Determine which section is currently in view
      const scrollPosition = window.scrollY + 100 // Add offset for better detection

      if (
        aboutRef.current &&
        scrollPosition >= aboutRef.current.offsetTop - 100 &&
        featuresRef.current &&
        scrollPosition < featuresRef.current.offsetTop - 100
      ) {
        setActiveSection("about")
      } else if (
        featuresRef.current &&
        scrollPosition >= featuresRef.current.offsetTop - 100 &&
        guidelinesRef.current &&
        scrollPosition < guidelinesRef.current.offsetTop - 100
      ) {
        setActiveSection("features")
      } else if (guidelinesRef.current && scrollPosition >= guidelinesRef.current.offsetTop - 100) {
        setActiveSection("guidelines")
      } else {
        setActiveSection("home")
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-emerald-100 font-manrope">
      {/* Navigation */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/MINSU.png" alt="Mindoro State University" width={40} height={40} className="rounded-full" />
            <span className="font-bold text-xl hidden sm:inline-block">
              <span className="text-yellow-500">MINSU</span>
              <span className="text-green-600">Connect</span>
            </span>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu} className="rounded-full">
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("home")}
              className={`text-sm font-medium hover:text-green-600 transition-colors ${
                activeSection === "home" ? "text-green-600" : ""
              }`}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className={`text-sm font-medium hover:text-green-600 transition-colors ${
                activeSection === "about" ? "text-green-600" : ""
              }`}
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className={`text-sm font-medium hover:text-green-600 transition-colors ${
                activeSection === "features" ? "text-green-600" : ""
              }`}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("guidelines")}
              className={`text-sm font-medium hover:text-green-600 transition-colors ${
                activeSection === "guidelines" ? "text-green-600" : ""
              }`}
            >
              Guidelines
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                asChild
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                asChild
              >
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </nav>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t animate-in">
            <div className="container mx-auto px-4 py-2">
              <nav className="flex flex-col space-y-3 py-3">
                <button
                  onClick={() => scrollToSection("home")}
                  className={`px-4 py-2 rounded-lg hover:bg-green-50 transition-colors text-left ${
                    activeSection === "home" ? "bg-green-100 text-green-600" : ""
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className={`px-4 py-2 rounded-lg hover:bg-green-50 transition-colors text-left ${
                    activeSection === "about" ? "bg-green-100 text-green-600" : ""
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection("features")}
                  className={`px-4 py-2 rounded-lg hover:bg-green-50 transition-colors text-left ${
                    activeSection === "features" ? "bg-green-100 text-green-600" : ""
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("guidelines")}
                  className={`px-4 py-2 rounded-lg hover:bg-green-50 transition-colors text-left ${
                    activeSection === "guidelines" ? "bg-green-100 text-green-600" : ""
                  }`}
                >
                  Guidelines
                </button>
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    className="w-full justify-center rounded-full border-green-500 text-green-600 hover:bg-green-50"
                    asChild
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button
                    className="w-full justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    asChild
                  >
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section ref={homeRef} className="py-16 md:py-24 px-4 min-h-[90vh] flex items-center" id="home">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-in slide-up-fade">
                  <span className="text-yellow-500">Mindoro State University</span>{" "}
                  <span className="text-green-600">Community Forum</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 animate-in slide-up-fade animation-delay-100">
                  Connect with fellow students, faculty, and staff in a safe, moderated environment where every voice
                  matters.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-in slide-up-fade animation-delay-200">
                  <Button
                    size="lg"
                    className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                    asChild
                  >
                    <Link href="/register">Join the Community</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 shadow-sm"
                    asChild
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </div>
              <div className="flex-1 flex justify-center animate-in slide-up-fade animation-delay-300">
                <div className="relative w-full max-w-md aspect-square">
                  <Image
                    src="/MINSU.png"
                    alt="Mindoro State University"
                    width={400}
                    height={400}
                    className="rounded-2xl shadow-xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section ref={aboutRef} className="py-16 bg-white px-4" id="about">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 animate-in slide-up-fade">
                What is <span className="text-yellow-500">MINSU</span>
                <span className="text-green-600">Connect</span>?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in slide-up-fade animation-delay-100">
                <span className="text-yellow-500">MINSU</span>
                <span className="text-green-600">Connect</span> is a forum-style community platform designed
                specifically for Mindoro State University. It provides a safe space for expression, connection, and
                support among students, faculty, and staff.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-xl shadow-md border-0 overflow-hidden animate-in slide-up-fade animation-delay-200">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                  <p className="text-muted-foreground">
                    To create a digital platform where the MINSU community can freely express ideas, share knowledge,
                    and build connections while maintaining a respectful, supportive environment through thoughtful
                    moderation.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-md border-0 overflow-hidden animate-in slide-up-fade animation-delay-300">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3">Our Values</h3>
                  <p className="text-muted-foreground">
                    We believe in academic integrity, respect for all individuals, privacy, and creating a safe space
                    where everyone in the university community feels welcome and heard.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 animate-in slide-up-fade animation-delay-400">
              <Card className="rounded-xl shadow-md border-0 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="md:w-1/3">
                      <Image
                        src="/community-support.png"
                        alt="University Community"
                        width={300}
                        height={300}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="md:w-2/3">
                      <h3 className="text-xl font-bold mb-3">
                        Why Choose <span className="text-yellow-500">MINSU</span>
                        <span className="text-green-600">Connect</span>?
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        In a digital world full of noise, <span className="text-yellow-500">MINSU</span>
                        <span className="text-green-600">Connect</span> stands out as a thoughtfully designed space
                        where meaningful connections happen within our university community. Our platform combines the
                        freedom to express yourself with the safety of responsible moderation.
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span>University-focused approach with student and faculty wellbeing at the center</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span>
                            Balanced moderation that respects academic freedom while ensuring community standards
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span>Tools designed to foster genuine connections and academic support</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="py-16 bg-gradient-to-br from-green-50 to-emerald-100 px-4" id="features">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 animate-in slide-up-fade">Key Features</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in slide-up-fade animation-delay-100">
                Discover the tools and features that make <span className="text-yellow-500">MINSU</span>
                <span className="text-green-600">Connect</span> a unique platform for university connection and
                expression.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-shadow animate-in slide-up-fade animation-delay-200">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Academic Discussions</h3>
                  <p className="text-sm text-muted-foreground">
                    Engage in course-specific discussions and academic debates with peers and faculty.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-shadow animate-in slide-up-fade animation-delay-300">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Community Interaction</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with students, faculty, and staff across different departments and programs.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-shadow animate-in slide-up-fade animation-delay-400">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Resource Sharing</h3>
                  <p className="text-sm text-muted-foreground">
                    Share and access study materials, research papers, and educational resources.
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-shadow animate-in slide-up-fade animation-delay-500">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Campus Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Stay informed about university events, announcements, and important deadlines.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 animate-in slide-up-fade animation-delay-600">
              <Card className="rounded-xl shadow-md border-0 overflow-hidden bg-white">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-bold mb-4">How It Works</h3>
                      <ol className="space-y-4">
                        <li className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm shadow-sm">
                            1
                          </div>
                          <div>
                            <h4 className="font-medium">Create Your Account</h4>
                            <p className="text-sm text-muted-foreground">
                              Sign up with your university email and set up your profile to join the community.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm shadow-sm">
                            2
                          </div>
                          <div>
                            <h4 className="font-medium">Share Your Thoughts</h4>
                            <p className="text-sm text-muted-foreground">
                              Create posts to share ideas, ask questions, or offer academic support.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm shadow-sm">
                            3
                          </div>
                          <div>
                            <h4 className="font-medium">Moderation Review</h4>
                            <p className="text-sm text-muted-foreground">
                              Our team reviews posts to ensure they follow university community guidelines.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm shadow-sm">
                            4
                          </div>
                          <div>
                            <h4 className="font-medium">Connect & Engage</h4>
                            <p className="text-sm text-muted-foreground">
                              Interact with others through comments, reactions, and direct messages.
                            </p>
                          </div>
                        </li>
                      </ol>
                    </div>
                    <div className="flex items-center justify-center">
                      <Image
                        src="/MINSU.png"
                        alt="Mindoro State University"
                        width={300}
                        height={300}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Guidelines Section */}
        <section ref={guidelinesRef} className="py-16 bg-white px-4" id="guidelines">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 animate-in slide-up-fade">Community Guidelines</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in slide-up-fade animation-delay-100">
                Our guidelines ensure that <span className="text-yellow-500">MINSU</span>
                <span className="text-green-600">Connect</span> remains a safe, respectful space for all university
                members.
              </p>
            </div>

            <Tabs defaultValue="dos" className="w-full animate-in slide-up-fade animation-delay-200">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-green-100">
                <TabsTrigger value="dos" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  Do's
                </TabsTrigger>
                <TabsTrigger value="donts" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  Don'ts
                </TabsTrigger>
              </TabsList>
              <TabsContent value="dos" className="animate-in">
                <Card className="rounded-xl shadow-md border-0">
                  <CardContent className="pt-6">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Uphold Academic Integrity</h4>
                          <p className="text-sm text-muted-foreground">
                            Maintain honesty and ethical standards in all academic discussions and resource sharing.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Share Constructively</h4>
                          <p className="text-sm text-muted-foreground">
                            Post content that adds value to the university community and fosters positive discussion.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Respect Privacy</h4>
                          <p className="text-sm text-muted-foreground">
                            Respect others' privacy and be mindful of the personal information you share about fellow
                            students and faculty.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Support Fellow Students</h4>
                          <p className="text-sm text-muted-foreground">
                            Offer encouragement and academic support to community members when appropriate.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="donts" className="animate-in">
                <Card className="rounded-xl shadow-md border-0">
                  <CardContent className="pt-6">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="h-3 w-3 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">No Academic Dishonesty</h4>
                          <p className="text-sm text-muted-foreground">
                            Sharing exam answers, plagiarizing content, or facilitating cheating is strictly prohibited.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="h-3 w-3 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">No Harassment</h4>
                          <p className="text-sm text-muted-foreground">
                            Bullying, intimidation, or harassment of any student, faculty, or staff is not tolerated.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="h-3 w-3 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">No Inappropriate Content</h4>
                          <p className="text-sm text-muted-foreground">
                            Content that violates university policies or is inappropriate for an academic setting is
                            prohibited.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="h-3 w-3 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">No Misinformation</h4>
                          <p className="text-sm text-muted-foreground">
                            Spreading false information about university policies, courses, or academic matters is not
                            permitted.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="text-center mt-8 animate-in slide-up-fade animation-delay-300">
              <span className="text-muted-foreground">Read Full Guidelines (coming soon)</span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4 animate-in slide-up-fade">
              Ready to Join Our University Community?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8 animate-in slide-up-fade animation-delay-100">
              Create an account today and start connecting with fellow students, faculty, and staff in a safe,
              supportive environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-up-fade animation-delay-200">
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-white/90 hover:text-green-700 rounded-full shadow-lg"
                asChild
              >
                <Link href="/register">Create Account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 rounded-full shadow-lg"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/MINSU.png"
                  alt="Mindoro State University"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="font-bold text-xl">
                  <span className="text-yellow-400">MINSU</span>
                  <span className="text-green-300">Connect</span>
                </span>
              </div>
              <p className="text-gray-400 mb-4">Mindoro State University's Community Forum</p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-100">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => scrollToSection("home")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("about")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("guidelines")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Guidelines
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-100">University Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Official MINSU Website
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Academic Calendar
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Student Portal
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Library Resources
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Mindoro State University. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => scrollToSection("home")}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-full shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all animate-in zoom-in"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
