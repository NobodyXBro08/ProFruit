import React from 'react';
import './Historia.css';
import Container from '../ui/Container.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';
import { FaLeaf, FaHandshake, FaIndustry, FaShoppingCart, FaWhatsapp, FaTruck, FaBoxOpen } from 'react-icons/fa';

const pillars = [
  {
    icon: FaHandshake,
    title: 'Atención rápida y efectiva',
    text: 'Proporcionamos a nuestros clientes una atención rápida, efectiva y eficiente.',
  },
  {
    icon: FaLeaf,
    title: 'Parte de tus sueños',
    text: 'Te apoyamos en proyectos o emprendimientos que quieras sacar adelante. Somos parte de tus sueños; con nosotros es posible.',
  },
  {
    icon: FaIndustry,
    title: 'Capacidad de producción',
    text: 'Gran capacidad de producción para ser el aliado estratégico de tiendas naturistas, especializadas o comercializadoras.',
  },
];

const services = [
  {
    icon: FaShoppingCart,
    title: 'Comercio electrónico',
    text: 'Compras por nuestra página web, con catálogo actualizado y proceso de pedido claro.',
  },
  {
    icon: FaWhatsapp,
    title: 'WhatsApp Business',
    text: 'Atención a nuestros clientes en tiempo real para resolver dudas y acompañar tu compra.',
  },
  {
    icon: FaTruck,
    title: 'Integración con envíos',
    text: 'Trabajamos con plataformas de envío como SkyDropx para llegar a todo Colombia.',
  },
  {
    icon: FaBoxOpen,
    title: 'Productos a granel',
    text: 'Disponibilidad de productos cada semana para tiendas y mayoristas.',
  },
];

export default function Historia() {
  return (
    <section className="historia" id="historia">
      <Container>
        <SectionHeader
          title="Un nuevo mundo de sabores, 100% natural"
          subtitle="En ProFruit nos comprometemos a ofrecer frutas y verduras deshidratadas de la más alta calidad, cultivadas de manera responsable y sostenible."
        />

        <div className="historia-intro">
          <p>
            Descubre un nuevo mundo de sabores con nuestros productos, 100% naturales, diseñados para brindarte
            una experiencia deliciosa y saludable. Nuestros productos son innovadores y están pensados para
            adaptarse a tu estilo de vida, ofreciéndote una opción práctica y sabrosa para alimentarte sanamente
            todos los días.
          </p>
          <p>
            Ya sea para un desayuno energético o un snack a media tarde, somos la elección ideal para quienes
            buscan cuidar su bienestar sin sacrificar el sabor. ¡Atrévete a disfrutar de una alimentación más
            consciente y deliciosa!
          </p>
        </div>

        <h3 className="historia-block-title">Marcando la diferencia</h3>
        <ul className="historia-pillars">
          {pillars.map(({ icon: Icon, title, text }) => (
            <li key={title} className="historia-pillar">
              <span className="historia-pillar-icon" aria-hidden>
                <Icon />
              </span>
              <h4>{title}</h4>
              <p>{text}</p>
            </li>
          ))}
        </ul>

        <h3 className="historia-block-title">Cómo te acompañamos</h3>
        <ul className="historia-services">
          {services.map(({ icon: Icon, title, text }) => (
            <li key={title} className="historia-service">
              <span className="historia-service-icon" aria-hidden>
                <Icon />
              </span>
              <div>
                <h4>{title}</h4>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
