'use client';

import React from 'react';
import { Phone, Mail, MapPin, Linkedin, Globe, Circle, Minus } from 'lucide-react';

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

interface MinimalTemplateProps {
  data: ParsedResumeData;
}

export const MinimalTemplate: React.FC<MinimalTemplateProps> = ({ data }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-light">
      {/* Header Section */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto">
            
            {/* Name and Title */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-extralight tracking-wide text-gray-900 mb-6">
                {data.name || 'Your Name'}
              </h1>
              <div className="w-16 h-px bg-gray-400 mx-auto mb-6"></div>
              <h2 className="text-xl md:text-2xl font-light text-gray-600 tracking-wider uppercase">
                {data.headline || 'Professional Title'}
              </h2>
            </div>

            {/* Contact Information */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-gray-600">
              {data.contact?.email && (
                <a href={`mailto:${data.contact.email}`} className="group flex items-center gap-3 hover:text-gray-900 transition-colors duration-300">
                  <Mail size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  <span className="text-sm tracking-wide">{data.contact.email}</span>
                </a>
              )}
              {data.contact?.phone && (
                <a href={`tel:${data.contact.phone}`} className="group flex items-center gap-3 hover:text-gray-900 transition-colors duration-300">
                  <Phone size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  <span className="text-sm tracking-wide">{data.contact.phone}</span>
                </a>
              )}
              {data.contact?.location && (
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-sm tracking-wide">{data.contact.location}</span>
                </div>
              )}
              {data.contact?.linkedin && (
                <a href={data.contact.linkedin} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 hover:text-gray-900 transition-colors duration-300">
                  <Linkedin size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  <span className="text-sm tracking-wide">LinkedIn</span>
                </a>
              )}
              {data.contact?.portfolio && (
                <a href={data.contact.portfolio} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 hover:text-gray-900 transition-colors duration-300">
                  <Globe size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  <span className="text-sm tracking-wide">Portfolio</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-16">
          
          {/* About Section */}
          {(data.bioGenerated || data.summary) && (
            <section>
              <div className="text-center mb-12">
                <h3 className="text-2xl font-light tracking-wider text-gray-800 mb-4">About</h3>
                <div className="w-8 h-px bg-gray-300 mx-auto"></div>
              </div>
              <p className="text-lg leading-relaxed text-gray-700 text-center max-w-2xl mx-auto">
                {data.bioGenerated || data.summary}
              </p>
            </section>
          )}

          {/* Experience Section */}
          {data.experience && data.experience.length > 0 && (
            <section>
              <div className="text-center mb-12">
                <h3 className="text-2xl font-light tracking-wider text-gray-800 mb-4">Experience</h3>
                <div className="w-8 h-px bg-gray-300 mx-auto"></div>
              </div>
              <div className="space-y-12">
                {data.experience.map((exp, index) => (
                  <div key={index} className="group">
                    <div className="border-l border-gray-200 pl-8 hover:border-gray-400 transition-colors duration-500">
                      <div className="relative">
                        <Circle 
                          size={8} 
                          className="absolute -left-10 top-2 text-gray-300 group-hover:text-gray-500 transition-colors fill-current" 
                        />
                        <div className="mb-4">
                          <h4 className="text-xl font-light text-gray-900 mb-1">{exp.title}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600">
                            <span className="font-light">{exp.company}</span>
                            <span className="hidden sm:inline text-gray-400">•</span>
                            <span className="text-sm text-gray-500">{exp.duration}</span>
                          </div>
                        </div>
                        {exp.description && (
                          <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills Section */}
          {data.skills && data.skills.length > 0 && (
            <section>
              <div className="text-center mb-12">
                <h3 className="text-2xl font-light tracking-wider text-gray-800 mb-4">Skills</h3>
                <div className="w-8 h-px bg-gray-300 mx-auto"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.skills.map((skill, index) => (
                  <div key={index} className="group text-center">
                    <div className="p-4 border border-gray-200 hover:border-gray-400 transition-all duration-300 hover:shadow-sm">
                      <Minus size={16} className="mx-auto mb-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      <span className="text-sm text-gray-700 tracking-wide">{skill}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects Section */}
          {data.projects && data.projects.length > 0 && (
            <section>
              <div className="text-center mb-12">
                <h3 className="text-2xl font-light tracking-wider text-gray-800 mb-4">Projects</h3>
                <div className="w-8 h-px bg-gray-300 mx-auto"></div>
              </div>
              <div className="space-y-12">
                {data.projects.map((project, index) => (
                  <div key={index} className="group">
                    <div className="border border-gray-200 p-8 hover:border-gray-400 hover:shadow-sm transition-all duration-300">
                      <h4 className="text-xl font-light text-gray-900 mb-4">{project.name}</h4>
                      <p className="text-gray-700 leading-relaxed mb-6">{project.description}</p>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {project.technologies.map((tech, techIndex) => (
                            <span key={techIndex} className="text-xs text-gray-600 border border-gray-300 px-3 py-1 tracking-wider uppercase">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education Section */}
          {data.education && data.education.length > 0 && (
            <section>
              <div className="text-center mb-12">
                <h3 className="text-2xl font-light tracking-wider text-gray-800 mb-4">Education</h3>
                <div className="w-8 h-px bg-gray-300 mx-auto"></div>
              </div>
              <div className="space-y-8">
                {data.education.map((edu, index) => (
                  <div key={index} className="text-center group">
                    <div className="border border-gray-200 p-6 hover:border-gray-400 transition-colors duration-300">
                      <h4 className="text-lg font-light text-gray-900 mb-2">{edu.degree}</h4>
                      <p className="text-gray-600 mb-1">{edu.school}</p>
                      {edu.year && (
                        <p className="text-sm text-gray-500">{edu.year}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-px bg-gray-300 mx-auto mb-6"></div>
            <p className="text-gray-500 text-sm tracking-wider">
              {data.name} • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MinimalTemplate;
