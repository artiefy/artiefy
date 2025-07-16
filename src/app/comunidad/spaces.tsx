"use client"

import { useState } from "react"
import { Search, Filter, Eye, ExternalLink, Calendar, User, Tag, ChevronDown } from "lucide-react"

export default function Component() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const spaces = [
    {
      id: 1,
      title: "Sistema de Monitoreo Solar",
      description:
        "Desarrollo de una plataforma IoT para monitorear paneles solares en tiempo real con análisis predictivo.",
      image: "/placeholder.svg?height=200&width=350",
      category: "Energía Renovable",
      author: "María González",
      date: "2024-01-15",
      tags: ["IoT", "Solar", "Python", "React"],
      views: 1250,
      status: "Completado",
    },
    {
      id: 2,
      title: "App de Gestión Energética",
      description: "Aplicación móvil para optimizar el consumo energético en hogares inteligentes.",
      image: "/placeholder.svg?height=200&width=350",
      category: "Tecnología",
      author: "Carlos Ruiz",
      date: "2024-02-20",
      tags: ["Mobile", "Flutter", "AI", "Smart Home"],
      views: 890,
      status: "En Desarrollo",
    },
    {
      id: 3,
      title: "Análisis de Datos Climáticos",
      description:
        "Espacio de machine learning para predecir patrones climáticos y su impacto en la generación de energía.",
      image: "/placeholder.svg?height=200&width=350",
      category: "Data Science",
      author: "Ana Martínez",
      date: "2024-03-10",
      tags: ["ML", "Python", "Climate", "Analytics"],
      views: 2100,
      status: "Completado",
    },
    {
      id: 4,
      title: "Simulador de Redes Eléctricas",
      description: "Herramienta de simulación para diseñar y optimizar redes de distribución eléctrica.",
      image: "/placeholder.svg?height=200&width=350",
      category: "Ingeniería",
      author: "Roberto Silva",
      date: "2024-02-05",
      tags: ["Simulation", "Electrical", "MATLAB", "Engineering"],
      views: 750,
      status: "En Desarrollo",
    },
    {
      id: 5,
      title: "Dashboard de Sostenibilidad",
      description: "Panel de control interactivo para visualizar métricas de sostenibilidad empresarial.",
      image: "/placeholder.svg?height=200&width=350",
      category: "Sostenibilidad",
      author: "Laura Pérez",
      date: "2024-01-28",
      tags: ["Dashboard", "D3.js", "Sustainability", "Visualization"],
      views: 1450,
      status: "Completado",
    },
    {
      id: 6,
      title: "Blockchain para Energía Verde",
      description: "Plataforma blockchain para certificar y comercializar créditos de energía renovable.",
      image: "/placeholder.svg?height=200&width=350",
      category: "Blockchain",
      author: "Diego Morales",
      date: "2024-03-15",
      tags: ["Blockchain", "Smart Contracts", "Green Energy", "Web3"],
      views: 980,
      status: "En Desarrollo",
    },
  ]

  const categories = [
    { value: "all", label: "Todas las categorías", count: spaces.length },
    { value: "energia", label: "Energía Renovable", count: 1 },
    { value: "tecnologia", label: "Tecnología", count: 1 },
    { value: "data", label: "Data Science", count: 1 },
    { value: "ingenieria", label: "Ingeniería", count: 1 },
    { value: "sostenibilidad", label: "Sostenibilidad", count: 1 },
    { value: "blockchain", label: "Blockchain", count: 1 },
  ]

  const filteredspaces = spaces.filter((space) => {
    const matchesCategory =
      selectedCategory === "all" || space.category.toLowerCase().includes(selectedCategory.toLowerCase())
    const matchesSearch =
      space.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const selectedCategoryLabel =
    categories.find((cat) => cat.value === selectedCategory)?.label || "Todas las categorías"

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f1729" }}>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar Espacios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-teal-700/50 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>
            </div>
            <div className="w-full md:w-64 relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 border border-teal-700/50 rounded-lg text-white hover:border-cyan-400/50 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <span>{selectedCategoryLabel}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-teal-700/50 rounded-lg shadow-lg z-10">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => {
                        setSelectedCategory(category.value)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-teal-700/30 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {category.label} ({category.count})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Espacios <span className="text-cyan-400">Artie</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Descubre Espacios innovadores desarrollados por nuestra comunidad de estudiantes y profesionales
          </p>
        </div>

        {/* spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredspaces.map((space) => (
            <div
              key={space.id}
              className="bg-slate-800/50 border border-teal-700/30 rounded-lg hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/10 overflow-hidden"
            >
              <div className="relative">
                <img
                  src={space.image || "/placeholder.svg"}
                  alt={space.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      space.status === "Completado" ? "bg-green-600 text-white" : "bg-orange-600 text-white"
                    }`}
                  >
                    {space.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">{space.title}</h3>
                    <p className="text-gray-300 text-sm line-clamp-3">{space.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {space.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs border border-cyan-400/30 text-cyan-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {space.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs border border-gray-600 text-gray-400 rounded-full">
                        +{space.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{space.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{space.views.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(space.date).toLocaleDateString("es-ES")}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tag className="w-4 h-4" />
                      <span>{space.category}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button className="flex-1 flex items-center justify-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Espacio
                    </button>
                    <button className="px-3 py-2 border border-teal-600 text-teal-300 hover:bg-teal-600/20 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
            Cargar más Espacios
          </button>
        </div>
      </main>
    </div>
  )
}
