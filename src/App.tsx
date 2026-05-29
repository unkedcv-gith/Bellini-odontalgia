/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Services } from './components/Services';
import { Gallery } from './components/Gallery';
import { Experience } from './components/Experience';
import { Contact } from './components/Contact';
import { AdminPanel } from './components/AdminPanel';


export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Monitor event cues requesting to open the administrative terminal
  useEffect(() => {
    const handleOpenAdmin = () => {
      setIsAdminOpen(true);
    };
    window.addEventListener('bellini-open-admin', handleOpenAdmin);
    return () => {
      window.removeEventListener('bellini-open-admin', handleOpenAdmin);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const isTransitioning = useRef(false);

  const [heroSubSlide, _setHeroSubSlide] = useState(0);
  const heroSubSlideRef = useRef(0);
  const lastNavWasWheelUp = useRef(false);

  // Lock system scroll of the body/window to (0,0) at all times.
  // This completely eliminates horizontal/vertical viewport-drifts leading to black screens in Vercel.
  useEffect(() => {
    const handleViewportLock = () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', handleViewportLock, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleViewportLock);
    };
  }, []);

  const setHeroSubSlide = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      _setHeroSubSlide(prev => {
        const next = val(prev);
        heroSubSlideRef.current = next;
        return next;
      });
    } else {
      _setHeroSubSlide(val);
      heroSubSlideRef.current = val;
    }
  };

  useEffect(() => {
    if (activeSection === 'hero') {
      if (!lastNavWasWheelUp.current) {
        setHeroSubSlide(0);
      }
    } else {
      lastNavWasWheelUp.current = false;
    }
  }, [activeSection]);

  const sections = ['hero', 'nosotros', 'casos', 'servicios', 'experiencia', 'contacto'];

  useEffect(() => {
    const handleNavScroll = (e: Event) => {
      isTransitioning.current = true;
      const customEvent = e as CustomEvent;
      const targetIdx = customEvent.detail?.targetIndex;
      if (targetIdx === 0) {
        setHeroSubSlide(0);
      }
      setTimeout(() => {
        isTransitioning.current = false;
      }, 1100);
    };

    window.addEventListener('nav-scroll-start', handleNavScroll);
    return () => {
      window.removeEventListener('nav-scroll-start', handleNavScroll);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Convert mouse wheel events to seamless section transitions
    const handleWheel = (e: WheelEvent) => {
      // Direct escape when scrolling inside any custom scrollbar/overflow container
      const targetElement = e.target as HTMLElement;
      if (targetElement) {
        const scrollContainer = targetElement.closest('.overflow-y-auto, .custom-scrollbar') as HTMLElement;
        if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
          return; // Allow native mouse wheel scrolling inside the element
        }
      }

      // Direct escape when any modal, modal-open class, or dialog is currently open
      if (
        document.body.classList.contains('modal-open') || 
        document.querySelector('.modal-overlay') || 
        document.querySelector('[role="dialog"]')
      ) {
        return; // Allow native, continuous vertical scrolling inside the open details panel
      }

      // Ignore if vertical scrolling is negligible or if a transition is active
      if (Math.abs(e.deltaY) < 25 || isTransitioning.current) {
        if (isTransitioning.current) {
          e.preventDefault();
        }
        return;
      }

      // Allow natural horizontal swipe adjustments on trackpads
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      e.preventDefault();

      // Find current index
      const viewportWidth = container.clientWidth;
      const currentScrollLeft = container.scrollLeft;
      const rawIndex = Math.round(currentScrollLeft / viewportWidth);
      const currentIndex = Math.max(0, Math.min(rawIndex, sections.length - 1));

      // Scroll-driven Hero sub-slide management
      if (currentIndex === 0) {
        const currentHeroSlide = heroSubSlideRef.current;
        if (e.deltaY > 0) {
          // Scrolling down
          if (currentHeroSlide < 2) {
            isTransitioning.current = true;
            setHeroSubSlide(prev => prev + 1);
            setTimeout(() => {
              isTransitioning.current = false;
            }, 1100);
            return;
          }
        } else {
          // Scrolling up
          if (currentHeroSlide > 0) {
            isTransitioning.current = true;
            setHeroSubSlide(prev => prev - 1);
            setTimeout(() => {
              isTransitioning.current = false;
            }, 1100);
            return;
          }
        }
      }

      // Intercept wheel up on Nosotros (index 1) to land on the 3rd sub-slide of Hero (index 2)
      if (currentIndex === 1 && e.deltaY < 0) {
        isTransitioning.current = true;
        lastNavWasWheelUp.current = true;
        setHeroSubSlide(2);
        container.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
        setTimeout(() => {
          isTransitioning.current = false;
        }, 1100);
        return;
      }

      let targetIndex = currentIndex;
      if (e.deltaY > 0) {
        // Scroll down / scroll right
        targetIndex = Math.min(currentIndex + 1, sections.length - 1);
      } else {
        // Scroll up / scroll left
        targetIndex = Math.max(currentIndex - 1, 0);
      }

      if (targetIndex !== currentIndex) {
        isTransitioning.current = true;
        if (targetIndex !== 0) {
          lastNavWasWheelUp.current = false;
        }
        
        container.scrollTo({
          left: targetIndex * viewportWidth,
          behavior: 'smooth'
        });

        // Throttle next trigger until transition completes for high-end feel
        setTimeout(() => {
          isTransitioning.current = false;
        }, 1100);
      }
    };

    // Track scroll progress and active section based on bounds
    const handleScroll = () => {
      const scrollWidth = container.scrollWidth - container.clientWidth;
      if (scrollWidth > 0) {
        setScrollProgress((container.scrollLeft / scrollWidth) * 100);
      }

      const viewportWidth = container.clientWidth;
      const currentScrollLeft = container.scrollLeft;

      const rawIndex = Math.round(currentScrollLeft / viewportWidth);
      const currentIndex = Math.max(0, Math.min(rawIndex, sections.length - 1));
      if (sections[currentIndex]) {
        setActiveSection(sections[currentIndex]);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Quick navigation helpers for arrow keys or subtle side floating triggers
  const navigateHorizontal = (direction: 'next' | 'prev') => {
    const container = containerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth;
    container.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0a0a0a] overflow-hidden font-sans">
      {/* Absolute Noise Overlay */}
      <div className="fixed inset-0 bg-noise z-0 pointer-events-none"></div>

      {/* Modern Top Luxury Navbar */}
      <Navbar activeSection={activeSection} />

      {/* Main Horizontal Snapping Container */}
      <div
        ref={containerRef}
        id="main-scroll-container"
        className="flex flex-row flex-nowrap overflow-x-auto overflow-y-hidden h-full w-full snap-x snap-mandatory relative z-10 select-none scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div id="hero" className="w-full min-w-full h-full flex-shrink-0 snap-start">
          <Hero activeSubSlide={heroSubSlide} />
        </div>
        <div id="nosotros" className="w-full min-w-full h-full flex-shrink-0 snap-start">
          <About />
        </div>
        <div id="casos" className="w-full min-w-full h-full flex-shrink-0 snap-start">
          <Gallery />
        </div>
        <div id="servicios" className="w-full min-w-full h-full flex-shrink-0 snap-start">
          <Services />
        </div>
        <div id="experiencia" className="w-full min-w-full h-full flex-shrink-0 snap-start">
          <Experience />
        </div>
        <div id="contacto" className="w-full min-w-full h-full flex-shrink-0 snap-start">
          <Contact />
        </div>
      </div>

      {/* Slim Dynamic Editorial Timeline at the bottom */}
      <div className="fixed bottom-8 left-6 md:left-16 right-6 md:right-16 z-30 flex justify-between items-center pointer-events-none">
        {/* Progress line */}
        <div className="flex items-center gap-4 w-1/3">
          <span className="font-serif text-[10px] tracking-widest text-[#f4f3ef]/40 uppercase">01</span>
          <div className="relative h-[1px] flex-grow bg-white/10">
            <div 
              className="absolute top-0 left-0 h-full bg-[var(--color-bellini-bone)] transition-all duration-300 ease-out"
              style={{ width: `${scrollProgress}%` }}
            ></div>
          </div>
          <span className="font-serif text-[10px] tracking-widest text-[#f4f3ef]/40 uppercase">06</span>
        </div>

        {/* Dynamic active section indicator name */}
        <div className="text-[9px] uppercase tracking-[0.3em] text-[#f4f3ef]/60 font-medium">
          {activeSection === 'hero' && 'Inicio'}
          {activeSection === 'nosotros' && 'Filosofía'}
          {activeSection === 'casos' && 'Casos Clínicos'}
          {activeSection === 'servicios' && 'Disciplinas'}
          {activeSection === 'experiencia' && 'La Experiencia'}
          {activeSection === 'contacto' && 'Sesión'}
        </div>
      </div>

      {/* Behind the scenes clinical database editing console */}
      <AdminPanel 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        onCasesUpdated={() => {
          // Push event notifying the gallery that live datasets have changed
          window.dispatchEvent(new CustomEvent('bellini-cases-updated'));
        }} 
      />
    </div>
  );
}
