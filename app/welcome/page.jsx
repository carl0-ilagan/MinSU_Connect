"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Menu, X, Check, Users, ArrowUp, GraduationCap, BookOpen, Building2 } from "lucide-react"

export default function WelcomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Create refs for each section
  const homeRef = useRef(null)
  const aboutRef = useRef(null)
  const featuresRef = useRef(null)
  const guidelinesRef = useRef(null)

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
            <span className="font-bold text-xl">
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
              {/* Branding for mobile menu */}
              <div className="flex items-center gap-2 mb-4">
                <Image src="/MINSU.png" alt="Mindoro State University" width={32} height={32} className="rounded-full" />
                <span className="font-bold text-lg">
                  <span className="text-yellow-500">MINSU</span>
                  <span className="text-green-600">Connect</span>
                </span>
              </div>
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

        {/* Our Team Section */}
        <section className="py-16 bg-white px-4" id="team">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 animate-in slide-up-fade">Meet the Team</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in slide-up-fade animation-delay-100">
                Get to know the dedicated individuals who brought MINSU Connect to life.
              </p>
            </div>

            {/* First row: 3 members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
              {/* Team Member 1: Allan Pedraza */}
              <div className="flex flex-col items-center text-center animate-in slide-up-fade animation-delay-200">
                <a href="https://www.facebook.com/allan.pedraza.536178" target="_blank" rel="noopener noreferrer" className="w-full h-full">
                  <Card className="w-full h-full rounded-xl shadow-md border-0 overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <CardContent className="pt-6 flex flex-col items-center h-full">
                      <Image
                        src="/Allan Pedraza.jpg"
                        alt="Allan Pedraza"
                        width={120}
                        height={120}
                        className="rounded-full mb-4 object-cover aspect-square"
                      />
                      <h3 className="font-bold text-lg">Allan Pedraza</h3>
                      <p className="text-sm text-muted-foreground">Team Member</p>
                      <p className="text-sm text-gray-600 mt-2">Contributed to the development and implementation of key features.</p>
                    </CardContent>
                  </Card>
                </a>
              </div>

              {/* Team Member 2: Carl Ilagan (Programmer) */}
              <div className="flex flex-col items-center text-center animate-in slide-up-fade animation-delay-300">
                <a href="https://www.facebook.com/llllllooooiii19/" target="_blank" rel="noopener noreferrer" className="w-full h-full">
                  <Card className="w-full h-full rounded-xl shadow-md border-0 overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <CardContent className="pt-6 flex flex-col items-center h-full">
                      <Image
                        src="/Carl Ilagan.jpg"
                        alt="Carl Ilagan"
                        width={120}
                        height={120}
                        className="rounded-full mb-4 object-cover aspect-square"
                      />
                      <h3 className="font-bold text-lg">Carl Ilagan</h3>
                      <p className="text-sm text-muted-foreground">Programmer</p>
                      <p className="text-sm text-gray-600 mt-2">Key developer focused on building responsive user interfaces and enhancing the user experience.</p>
                    </CardContent>
                  </Card>
                </a>
              </div>

              {/* Team Member 3: Sir. Nicko Magnaye (Adviser) */}
              <div className="flex flex-col items-center text-center animate-in slide-up-fade animation-delay-400">
                <a href="https://www.facebook.com/eyangam.okcin" target="_blank" rel="noopener noreferrer" className="w-full h-full">
                  <Card className="w-full h-full rounded-xl shadow-md border-0 overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                    <CardContent className="pt-6 flex flex-col items-center h-full">
                      <Image
                        src="/Sir. Nicko Magnaye.png"
                        alt="Sir. Nicko Magnaye"
                        width={120}
                        height={120}
                        className="rounded-full mb-4 object-cover aspect-square"
                      />
                      <h3 className="font-bold text-lg">Sir. Nicko Magnaye</h3>
                      <p className="text-sm text-muted-foreground">Project Adviser</p>
                      <p className="text-sm text-gray-600 mt-2">Provided expert guidance and mentorship, ensuring the project's successful completion.</p>
                    </CardContent>
                  </Card>
                </a>
              </div>
            </div>

            {/* Second row: 2 members, centered */}
            <div className="flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Team Member 4: Theus Vito (Programmer) */}
                <div className="flex flex-col items-center text-center animate-in slide-up-fade animation-delay-500">
                  <a href="https://www.facebook.com/aezratheus.vito.05" target="_blank" rel="noopener noreferrer" className="w-full h-full">
                    <Card className="w-full h-full rounded-xl shadow-md border-0 overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                      <CardContent className="pt-6 flex flex-col items-center h-full">
                        <Image
                          src="/Theus Vito.jpg"
                          alt="Theus Vito"
                          width={120}
                          height={120}
                          className="rounded-full mb-4 object-cover aspect-square"
                        />
                        <h3 className="font-bold text-lg">Theus Vito</h3>
                        <p className="text-sm text-muted-foreground">Programmer</p>
                        <p className="text-sm text-gray-600 mt-2">Responsible for developing backend functionalities and integrating the application with necessary services.</p>
                      </CardContent>
                    </Card>
                  </a>
                </div>

                {/* Team Member 5: Doms Agoncillo */}
                <div className="flex flex-col items-center text-center animate-in slide-up-fade animation-delay-600">
                  <a href="https://www.facebook.com/doms.second" target="_blank" rel="noopener noreferrer" className="w-full h-full">
                    <Card className="w-full h-full rounded-xl shadow-md border-0 overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-lg">
                      <CardContent className="pt-6 flex flex-col items-center h-full">
                        <Image
                          src="/Doms Agoncillo.jpg"
                          alt="Doms Agoncillo"
                          width={120}
                          height={120}
                          className="rounded-full mb-4 object-cover aspect-square"
                        />
                        <h3 className="font-bold text-lg">Doms Agoncillo</h3>
                        <p className="text-sm text-muted-foreground">Team Member</p>
                        <p className="text-sm text-gray-600 mt-2">Assisted in various aspects of the project development, contributing to overall progress.</p>
                      </CardContent>
                    </Card>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Guidelines Section */}
        <section ref={guidelinesRef} className="py-16 bg-white px-4" id="guidelines">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 animate-in slide-up-fade">Community Guidelines</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in slide-up-fade animation-delay-100">
                To ensure a positive and respectful environment, please adhere to our guidelines:
              </p>
            </div>

            <Card className="rounded-xl shadow-md border-0 overflow-hidden animate-in slide-up-fade animation-delay-200">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-xl mb-2">Respect and Inclusivity</h3>
                    <p className="text-muted-foreground">
                      Treat all members with respect, regardless of their background, beliefs, or identity. Harassment,
                      discrimination, or hateful content is strictly prohibited.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Academic Integrity</h3>
                    <p className="text-muted-foreground">
                      Uphold academic honesty. Do not engage in plagiarism, cheating, or any other form of academic
                      misconduct. Sharing copyrighted materials without permission is not allowed.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Relevant Content</h3>
                    <p className="text-muted-foreground">
                      Keep discussions relevant to the university community. Avoid spam, self-promotion, or off-topic
                      content.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Privacy and Safety</h3>
                    <p className="text-muted-foreground">
                      Protect your personal information and respect the privacy of others. Do not share sensitive data
                      or engage in any activity that could compromise the safety or security of the community.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Constructive Communication</h3>
                    <p className="text-muted-foreground">
                      Engage in discussions constructively. Disagreements are natural, but express your views respectfully
                      and focus on the topic at hand.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-muted-foreground animate-in slide-up-fade animation-delay-300">
              Violations of these guidelines may result in content removal, temporary suspension, or permanent banning
              from the platform.
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

      <footer className="bg-gray-800 text-gray-300 py-10 px-4">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/MINSU.png" alt="MINSU Logo" width={40} height={40} className="rounded-full" />
              <span className="font-bold text-2xl text-white">
                <span className="text-yellow-400">MINSU</span><span className="text-green-500">Connect</span>
              </span>
            </div>
            <p className="text-sm">
              The official community platform for Mindoro State University. Connect, share, and engage with your
              university community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => scrollToSection("home")} className="hover:text-white transition-colors">Home</button></li>
              <li><button onClick={() => scrollToSection("about")} className="hover:text-white transition-colors">About</button></li>
              <li><button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors">Features</button></li>
              <li><button onClick={() => scrollToSection("guidelines")} className="hover:text-white transition-colors">Guidelines</button></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
            </ul>
          </div>

          {/* Resources & Enrollment */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources & Enrollment</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://www.minsu.edu.ph/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Official MINSU Website</a></li>
              <li><a href="https://mmc-enrollment.minsu.edu.ph/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Main Campus Enrollment</a></li>
              <li><a href="https://mbc.enrollment.minsu.edu.ph/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Bongabong Campus Enrollment</a></li>
               {/* Add Calapan Campus Enrollment if available */}
               <li><a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors opacity-50 cursor-not-allowed">Calapan City Campus Enrollment (Coming Soon)</a></li>
            </ul>
          </div>

          {/* Contact Info (Example) */}
          {/*
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: info@minsuconnect.com</li>
              <li>Phone: (123) 456-7890</li>
              <li>Address: University Campus, Mindoro</li>
            </ul>
          </div>
          */}

        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} MINSU Connect. All rights reserved.
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          className="fixed bottom-6 right-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors z-50"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
