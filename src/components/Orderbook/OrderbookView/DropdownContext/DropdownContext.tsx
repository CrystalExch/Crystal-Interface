import React from 'react';

interface DropdownContextProps {
  openDropdown: string | null;
  setOpenDropdown: (dropdownName: string | null) => void;
}

const DropdownContext = React.createContext<DropdownContextProps>({
  openDropdown: null,
  setOpenDropdown: () => {},
});

export default DropdownContext;
