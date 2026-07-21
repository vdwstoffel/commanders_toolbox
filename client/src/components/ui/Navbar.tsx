import { useUser } from "../user/useUser";
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Bars3Icon, XMarkIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "../../../public/logo.png";

const navigation = [
  { name: "Home", href: "/", current: false },
  { name: "Decks", href: "/decks", current: false },
];

const subMenu = [
  { name: "Color", href: "/explore/color" },
  { name: "Theme", href: "/explore/themes" },
  { name: "Typal", href: "/explore/typal" },
];

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  /** Auth details */
  const { isAuthenticated, logout } = useUser();
  const navigate = useNavigate();

  /** FUNCTIONS */
  function logoutHandler() {
    logout();
    navigate("/");
  }

  return (
    <Disclosure as="nav" className="bg-card border-b border-border sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:outline-hidden focus:ring-inset">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center gap-2">
              <img alt="Commander's Toolbox logo" src={logo} className="h-8 w-auto" />
              <span className="hidden sm:block font-display text-lg font-bold tracking-wide text-primary">Commander's Toolbox</span>
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className={classNames(
                      item.current ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      "rounded-md px-3 py-2 text-sm font-medium"
                    )}
                  >
                    {item.name}
                  </NavLink>
                ))}
                {/* Dropdown menu for the explore pages */}
                <Menu as="div" className="relative">
                  <MenuButton className="inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md">
                    Explore
                    <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.66a.75.75 0 01-1.08 0l-4.25-4.66a.75.75 0 01.02-1.06z" />
                    </svg>
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-popover py-1 shadow-lg ring-1 ring-border focus:outline-none z-10">
                    {subMenu.map((item) => {
                      return (
                        <MenuItem key={item.name}>
                          <NavLink to={item.href} className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                            {item.name}
                          </NavLink>
                        </MenuItem>
                      );
                    })}
                  </MenuItems>
                </Menu>
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Profile dropdown If user is not logged in show login button */}
            {isAuthenticated ? (
              <Menu as="div" className="relative ml-3">
                <div>
                  <MenuButton className="relative flex rounded-full bg-muted text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:outline-hidden">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    <UserCircleIcon aria-hidden="true" className="size-8 rounded-full text-muted-foreground" />
                  </MenuButton>
                </div>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-popover py-1 shadow-lg ring-1 ring-border transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  <MenuItem>
                    <a href="#" className="block px-4 py-2 text-sm text-popover-foreground data-focus:bg-accent data-focus:text-accent-foreground data-focus:outline-hidden">
                      Your Profile
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a href="#" className="block px-4 py-2 text-sm text-popover-foreground data-focus:bg-accent data-focus:text-accent-foreground data-focus:outline-hidden">
                      Settings
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <p
                      onClick={logoutHandler}
                      className="block px-4 py-2 text-sm text-popover-foreground data-focus:bg-accent data-focus:text-accent-foreground data-focus:outline-hidden hover:cursor-pointer"
                    >
                      Sign out
                    </p>
                  </MenuItem>
                </MenuItems>
              </Menu>
            ) : (
              <NavLink to="/login" className="text-muted-foreground hover:text-foreground hover:cursor-pointer">
                Login
              </NavLink>
            )}
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              aria-current={item.current ? "page" : undefined}
              className={classNames(
                item.current ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "block rounded-md px-3 py-2 text-base font-medium"
              )}
            >
              {item.name}
            </NavLink>
          ))}
          {/* Dropdown menu for the explore pages */}
          <Menu as="div" className="relative">
            <MenuButton className="inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md">
              Explore
              <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.66a.75.75 0 01-1.08 0l-4.25-4.66a.75.75 0 01.02-1.06z" />
              </svg>
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-popover py-1 shadow-lg ring-1 ring-border focus:outline-none z-10">
              {subMenu.map((item) => {
                return (
                  <MenuItem key={item.name}>
                    <NavLink to={item.href} className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                      {item.name}
                    </NavLink>
                  </MenuItem>
                );
              })}
            </MenuItems>
          </Menu>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
