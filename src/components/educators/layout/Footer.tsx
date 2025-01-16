import React from "react";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-primary py-12 w-full">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Sobre Nosotros</h3>
            <p className="text-gray-400">Empoderando a los estudiantes de todo el mundo con educación en línea de calidad.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">Cursos</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Educadores</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Centro de Ayuda</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contacto</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: info@edulearn.com</li>
              <li>Teléfono: +1 234 567 890</li>
              <li>Dirección: 123 Learning St, Education City</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Síguenos</h3>
            <div className="flex space-x-4">
              <FaFacebook className="text-2xl hover:text-blue-400 cursor-pointer" />
              <FaTwitter className="text-2xl hover:text-blue-400 cursor-pointer" />
              <FaInstagram className="text-2xl hover:text-pink-400 cursor-pointer" />
              <FaLinkedin className="text-2xl hover:text-blue-400 cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>© 2024 EduLearn. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
