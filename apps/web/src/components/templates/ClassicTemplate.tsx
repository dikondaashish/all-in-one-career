'use client';

import React from 'react';
import { Phone, Mail, MapPin, Linkedin, Globe, Calendar, Award, Briefcase } from 'lucide-react';

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

interface ClassicTemplateProps {
  data: ParsedResumeData;
}

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ data }) => {
  return (
    <div className="min-h-screen bg-gray-50 font-serif">
      {/* Header Section */}
      <header className="bg-white border-b-4 border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4 tracking-wide">
              {data.name || 'Professional Name'}
            </h1>
            <div className="w-24 h-1 bg-gray-800 mx-auto mb-6"></div>
            <h2 className="text-xl md:text-2xl text-gray-600 font-light mb-6 uppercase tracking-wider">
              {data.headline || 'Professional Title'}
            </h2>
            
            {/* Contact Information */}
            <div className="flex flex-wrap justify-center gap-8 text-gray-700">
              {data.contact?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-gray-600" />
                  <span>{data.contact.email}</span>
                </div>
              )}
              {data.contact?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-gray-600" />
                  <span>{data.contact.phone}</span>
                </div>
              )}
              {data.contact?.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-gray-600" />
                  <span>{data.contact.location}</span>
                </div>
              )}
              {data.contact?.linkedin && (
                <a href={data.contact.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                  <Linkedin size={18} className="text-gray-600" />
                  <span>LinkedIn</span>
                </a>
              )}
              {data.contact?.portfolio && (
                <a href={data.contact.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                  <Globe size={18} className="text-gray-600" />
                  <span>Portfolio</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Professional Summary */}
          {(data.bioGenerated || data.summary) && (
            <section className="bg-white rounded-lg shadow-md p-8 mb-8 border-l-4 border-gray-800">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 uppercase tracking-wider flex items-center gap-3">
                <Award className="text-gray-600" size={24} />
                Professional Summary
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {data.bioGenerated || data.summary}
              </p>
            </section>
          )}

          {/* Professional Experience */}
          {data.experience && data.experience.length > 0 && (
            <section className="bg-white rounded-lg shadow-md p-8 mb-8 border-l-4 border-gray-800">
              <h3 className="text-2xl font-bold text-gray-800 mb-8 uppercase tracking-wider flex items-center gap-3">
                <Briefcase className="text-gray-600" size={24} />
                Professional Experience
              </h3>
              <div className="space-y-8">
                {data.experience.map((exp, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 mb-1">{exp.title}</h4>
                        <p className="text-lg text-gray-600 font-semibold">{exp.company}</p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 mt-2 md:mt-0">
                        <Calendar size={16} />
                        <span className="italic">{exp.duration}</span>
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills & Education Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-8 border-l-4 border-gray-600">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 uppercase tracking-wider">
                  Core Competencies
                </h3>
                <div className="space-y-3">
                  {data.skills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-800">{skill}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <div 
                            key={dot} 
                            className={`w-2 h-2 rounded-full ${
                              dot <= 4 ? 'bg-gray-800' : 'bg-gray-300'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
              <section className="bg-white rounded-lg shadow-md p-8 border-l-4 border-gray-600">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 uppercase tracking-wider">
                  Education
                </h3>
                <div className="space-y-6">
                  {data.education.map((edu, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-gray-800 mb-2">{edu.degree}</h4>
                      <p className="text-gray-600 font-semibold mb-1">{edu.school}</p>
                      {edu.year && (
                        <p className="text-gray-500 text-sm italic">{edu.year}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <section className="bg-white rounded-lg shadow-md p-8 border-l-4 border-gray-800">
              <h3 className="text-2xl font-bold text-gray-800 mb-8 uppercase tracking-wider">
                Notable Projects
              </h3>
              <div className="space-y-8">
                {data.projects.map((project, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">{project.name}</h4>
                    <p className="text-gray-700 leading-relaxed mb-4">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div>
                        <p className="text-gray-600 font-semibold mb-2">Technologies Used:</p>
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, techIndex) => (
                            <span key={techIndex} className="bg-gray-100 border border-gray-300 text-gray-800 px-3 py-1 rounded text-sm font-medium">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 border-t-4 border-gray-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="border-t border-gray-600 pt-6">
              <p className="text-gray-300 font-light">
                {data.name} • Professional Portfolio • {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClassicTemplate;
