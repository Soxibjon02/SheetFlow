import React, { createContext, useContext, useState } from 'react';

interface NavContextType {
  isMobileNavOpen: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

const NavContext = createContext<NavContextType>({
  isMobileNavOpen: false,
  toggleMobileNav: () => {},
  closeMobileNav: () => {},
});

export const NavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setIsMobileNavOpen(false);

  return (
    <NavContext.Provider value={{ isMobileNavOpen, toggleMobileNav, closeMobileNav }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => useContext(NavContext);
