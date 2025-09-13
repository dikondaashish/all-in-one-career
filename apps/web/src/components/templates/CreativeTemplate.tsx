'use client';

import React from 'react';
import { Phone, Mail, MapPin, Linkedin, Globe, Palette, Zap, Star, Heart, Sparkles } from 'lucide-react';

interface ParsedResumeData {
  name: string;
  summary?: string;
  headline?: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year?: string;
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  bioGenerated?: string;
}

interface CreativeTemplateProps {
  data: ParsedResumeData;
}

const CreativeTemplate: React.FC<CreativeTemplateProps> = ({ data }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-pink-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-orange-300 rounded-full opacity-20 animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-yellow-300 rounded-full opacity-20 animate-bounce"></div>
      </div>

      {/* Header Section */}
      <header className="relative bg-gradient-to-r from-pink-500 via-purple-600 to-orange-500 text-white overflow-hidden">
        {/* Creative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')]"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Creative Name Display */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-black mb-4 transform hover:scale-105 transition-transform duration-300">
                <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                  {data.name || 'Creative Professional'}
                </span>
              </h1>
              <div className="flex justify-center gap-4 mb-6">
                <Sparkles className="text-yellow-300 animate-pulse" size={24} />
                <Star className="text-pink-300 animate-bounce" size={24} />
                <Heart className="text-red-300 animate-pulse" size={24} />
                <Zap className="text-orange-300 animate-bounce" size={24} />
              </div>
            </div>

            <h2 className="text-2xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
              {data.headline || 'Creative Professional'}
            </h2>
            
            {/* Bio with creative styling */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-8 border border-white/20">
              <p className="text-lg md:text-xl leading-relaxed text-white/90">
                {data.bioGenerated || data.summary || 'Creative professional passionate about innovative design and artistic expression.'}
              </p>
            </div>

            {/* Contact Info with Creative Icons */}
            <div className="flex flex-wrap justify-center gap-6">
              {data.contact?.email && (
                <a href={`mailto:${data.contact.email}`} className="group flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-full px-6 py-3 transition-all duration-300 transform hover:scale-105">
                  <Mail className="text-pink-200 group-hover:text-white transition-colors" size={20} />
                  <span className="hidden sm:inline font-medium">{data.contact.email}</span>
                </a>
              )}
              {data.contact?.phone && (
                <a href={`tel:${data.contact.phone}`} className="group flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-full px-6 py-3 transition-all duration-300 transform hover:scale-105">
                  <Phone className="text-purple-200 group-hover:text-white transition-colors" size={20} />
                  <span className="hidden sm:inline font-medium">{data.contact.phone}</span>
                </a>
              )}
              {data.contact?.portfolio && (
                <a href={data.contact.portfolio} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-full px-6 py-3 transition-all duration-300 transform hover:scale-105">
                  <Palette className="text-orange-200 group-hover:text-white transition-colors" size={20} />
                  <span className="hidden sm:inline font-medium">Portfolio</span>
                </a>
              )}
              {data.contact?.linkedin && (
                <a href={data.contact.linkedin} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-full px-6 py-3 transition-all duration-300 transform hover:scale-105">
                  <Linkedin className="text-blue-200 group-hover:text-white transition-colors" size={20} />
                  <span className="hidden sm:inline font-medium">LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Creative Skills Section */}
          {data.skills && data.skills.length > 0 && (
            <section className="mb-16">
              <h3 className="text-4xl font-black text-center mb-12">
                <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
                  Creative Arsenal
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.skills.map((skill, index) => {
                  const colors = [
                    'from-pink-400 to-pink-600',
                    'from-purple-400 to-purple-600', 
                    'from-orange-400 to-orange-600',
                    'from-yellow-400 to-yellow-600',
                    'from-red-400 to-red-600',
                    'from-blue-400 to-blue-600'
                  ];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <div key={index} className="group transform hover:scale-110 transition-all duration-300">
                      <div className={`bg-gradient-to-br ${colorClass} rounded-2xl p-6 text-white text-center shadow-lg hover:shadow-2xl transition-all duration-300`}>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Palette className="text-white" size={24} />
                        </div>
                        <span className="font-bold text-sm">{skill}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Experience with Creative Timeline */}
          {data.experience && data.experience.length > 0 && (
            <section className="mb-16">
              <h3 className="text-4xl font-black text-center mb-12">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Creative Journey
                </span>
              </h3>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-400 via-purple-500 to-orange-500 rounded-full"></div>
                
                <div className="space-y-12">
                  {data.experience.map((exp, index) => (
                    <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                      {/* Timeline dot */}
                      <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full border-4 border-white shadow-lg z-10"></div>
                      
                      {/* Content card */}
                      <div className={`ml-16 md:ml-0 ${index % 2 === 0 ? 'md:mr-8 md:text-right' : 'md:ml-8'} md:w-1/2`}>
                        <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-pink-200">
                          <h4 className="text-2xl font-bold text-gray-800 mb-2">{exp.title}</h4>
                          <p className="text-pink-600 font-bold text-lg mb-2">{exp.company}</p>
                          <p className="text-gray-500 mb-4 font-medium">{exp.duration}</p>
                          {exp.description && (
                            <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Projects Gallery */}
          {data.projects && data.projects.length > 0 && (
            <section className="mb-16">
              <h3 className="text-4xl font-black text-center mb-12">
                <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                  Creative Showcase
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data.projects.map((project, index) => {
                  const gradients = [
                    'from-pink-400 via-purple-500 to-indigo-500',
                    'from-yellow-400 via-orange-500 to-red-500',
                    'from-green-400 via-blue-500 to-purple-500',
                    'from-pink-400 via-red-500 to-orange-500'
                  ];
                  const gradient = gradients[index % gradients.length];
                  
                  return (
                    <div key={index} className="group transform hover:scale-105 transition-all duration-300">
                      <div className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                        {/* Project header with gradient */}
                        <div className={`bg-gradient-to-r ${gradient} p-6 text-white relative overflow-hidden`}>
                          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                          <h4 className="text-xl font-bold mb-2 relative z-10">{project.name}</h4>
                          <Sparkles className="absolute bottom-2 right-2 opacity-50" size={24} />
                        </div>
                        
                        {/* Project content */}
                        <div className="p-6">
                          <p className="text-gray-700 leading-relaxed mb-4">{project.description}</p>
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {project.technologies.map((tech, techIndex) => (
                                <span key={techIndex} className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium border border-pink-200">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Education with Creative Cards */}
          {data.education && data.education.length > 0 && (
            <section className="mb-16">
              <h3 className="text-4xl font-black text-center mb-12">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Learning Path
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.education.map((edu, index) => (
                  <div key={index} className="group transform hover:scale-105 transition-all duration-300">
                    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-8 shadow-lg hover:shadow-xl border-2 border-purple-100 hover:border-purple-300 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Star className="text-white" size={24} />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">{edu.degree}</h4>
                          <p className="text-purple-600 font-semibold">{edu.school}</p>
                        </div>
                      </div>
                      {edu.year && (
                        <p className="text-gray-500 font-medium">{edu.year}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Creative Footer */}
      <footer className="bg-gradient-to-r from-gray-800 via-purple-900 to-pink-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMyIvPjwvZz48L2c+PC9zdmc=')] opacity-20"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center gap-4 mb-6">
              <Heart className="text-pink-400 animate-pulse" size={24} />
              <Sparkles className="text-yellow-400 animate-bounce" size={24} />
              <Star className="text-purple-400 animate-pulse" size={24} />
            </div>
            <p className="text-xl font-medium mb-2">
              Thank you for exploring my creative universe!
            </p>
            <p className="text-purple-200">
              © 2024 {data.name} • Where creativity meets innovation • Made with ❤️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CreativeTemplate;
