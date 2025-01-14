import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import styles from '../styles/Home.module.css';

export default async function TestEslintPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get('https://api.example.com/data');
      setData(result.data);
    };
    fetchData();
  }, []);

  const handleClick = async (e) => {
    e.preventDefault();
    console.log('Button clicked');
  };

  return (
    <div className={styles.container}>
      <h1 style={{ color: 'blue', fontSize: '24px' }}>Bienvenido a Artiefy</h1>
      <img src="/logo.png" alt="Logo" />
      <p>{data ? data : 'Cargando...'}</p>
      <a href="#" onclick="handleClick()">
        Enlace incorrecto
      </a>
      <button onClick={handleClick}>Botón no accesible</button>
      <Button onClick={handleClick}>Botón de UI</Button>
      <div className="custom-class">Contenido personalizado</div>
      <div className="rounded-lg bg-red-500 p-4 text-white shadow-md transition duration-300 ease-in-out hover:bg-red-600">
        {/* Clases de Tailwind desordenadas */}
        <div className="rounded-md bg-blue-500 p-2 text-center text-lg font-bold text-white hover:bg-blue-600">
          Texto centrado con fondo azul
        </div>
        <div className="rounded-lg bg-green-500 p-4 text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-green-600">
          Texto con fondo verde
        </div>
        <div className="rounded-lg bg-yellow-500 p-4 text-black shadow-md transition duration-300 ease-in-out hover:bg-yellow-600">
          Texto con fondo amarillo
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps = async () => {
  const res = await fetch('https://api.example.com/data');
  const data = await res.json();
  return { props: { data } };
};
