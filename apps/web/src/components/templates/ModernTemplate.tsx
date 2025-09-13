'use client';

import React from 'react';
import { Phone, Mail, MapPin, Linkedin, Globe, Github, Download, ExternalLink } from 'lucide-react';

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

interface ModernTemplateProps {
  data: ParsedResumeData;
}

export const ModernTemplate: React.FC<ModernTemplateProps> = ({ data }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Profile Image Placeholder */}
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-4xl md:text-5xl font-bold text-white/80">
                  {data.name?.charAt(0) || 'P'}
                </span>
              </div>
              
              {/* Hero Content */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  {data.name || 'Professional Name'}
                </h1>
                <h2 className="text-xl md:text-2xl font-light mb-4 text-blue-100">
                  {data.headline || 'Professional Title'}
                </h2>
                <p className="text-lg text-blue-50 max-w-2xl leading-relaxed">
                  {data.bioGenerated || data.summary || 'Professional summary and bio will appear here.'}
                </p>
                
                {/* Contact Info */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-8">
                  {data.contact?.email && (
                    <a href={`mailto:${data.contact.email}`} className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                      <Mail size={18} />
                      <span className="hidden sm:inline">{data.contact.email}</span>
                    </a>
                  )}
                  {data.contact?.phone && (
                    <a href={`tel:${data.contact.phone}`} className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                      <Phone size={18} />
                      <span className="hidden sm:inline">{data.contact.phone}</span>
                    </a>
                  )}
                  {data.contact?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={18} />
                      <span className="hidden sm:inline">{data.contact.location}</span>
                    </div>
                  )}
                  {data.contact?.linkedin && (
                    <a href={data.contact.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                      <Linkedin size={18} />
                      <span className="hidden sm:inline">LinkedIn</span>
                    </a>
                  )}
                  {data.contact?.portfolio && (
                    <a href={data.contact.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-200 transition-colors">
                      <Globe size={18} />
                      <span className="hidden sm:inline">Portfolio</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column - Skills & Education */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Skills Section */}
              {data.skills && data.skills.length > 0 && (
                <section className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    Skills
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {data.skills.map((skill, index) => (
                      <div key={index} className="group">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200 hover:shadow-md transition-all duration-300">
                          <span className="font-medium text-gray-800">{skill}</span>
                          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${85 + Math.random() * 15}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Education Section */}
              {data.education && data.education.length > 0 && (
                <section className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                    Education
                  </h3>
                  <div className="space-y-4">
                    {data.education.map((edu, index) => (
                      <div key={index} className="border-l-4 border-blue-400 pl-4 py-2">
                        <h4 className="font-semibold text-gray-800">{edu.degree}</h4>
                        <p className="text-blue-600 font-medium">{edu.school}</p>
                        {edu.year && <p className="text-gray-500 text-sm">{edu.year}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Experience & Projects */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Experience Section */}
              {data.experience && data.experience.length > 0 && (
                <section className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
                  <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                    <div className="w-2 h-10 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                    Professional Experience
                  </h3>
                  <div className="space-y-8">
                    {data.experience.map((exp, index) => (
                      <div key={index} className="relative pl-8 border-l-2 border-blue-200 last:border-l-0">
                        <div className="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full border-4 border-white shadow-lg"></div>
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-bold text-gray-800 mb-2">{exp.title}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                            <p className="text-blue-600 font-semibold">{exp.company}</p>
                            <span className="hidden sm:inline text-gray-400">•</span>
                            <p className="text-gray-600">{exp.duration}</p>
                          </div>
                          {exp.description && (
                            <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Projects Section */}
              {data.projects && data.projects.length > 0 && (
                <section className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
                  <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                    <div className="w-2 h-10 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                    Featured Projects
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.projects.map((project, index) => (
                      <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                        <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <ExternalLink size={20} className="text-blue-500" />
                          {project.name}
                        </h4>
                        <p className="text-gray-700 mb-4 leading-relaxed">{project.description}</p>
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech, techIndex) => (
                              <span key={techIndex} className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-300">
              © 2024 {data.name}. Professional portfolio powered by modern design.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModernTemplate;
