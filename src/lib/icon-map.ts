
import {
  FlaskConical, HeartPulse, Microscope, Droplets, Zap, Bug, Radiation, ShieldCheck, Clipboard, PackagePlus, TestTube, Layers, Container, type LucideIcon, Package, Users, UserPlus, FileText, BarChart2, Settings, LayoutDashboard, UserCircle, Atom, Edit, // Added Edit
  User as LucideUser 
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  FlaskConical,
  HeartPulse,
  Microscope,
  Droplets,
  Zap, 
  Bug, 
  Radiation, 
  ShieldCheck, 
  Clipboard, 
  PackagePlus, 
  TestTube, 
  Layers, 
  Container, 
  Package, 
  Users, 
  UserPlus, 
  FileText, 
  BarChart2, 
  Settings,
  LayoutDashboard,
  User: LucideUser, 
  UserCircle,
  Atom,
  Edit, // Added Edit
};

export const defaultCategoryIcon: LucideIcon = TestTube; 

export const getIconByName = (name?: string | null): LucideIcon => {
  if (name && iconMap[name]) {
    return iconMap[name];
  }
  return defaultCategoryIcon;
};

export const availableIconsForCategories = {
  FlaskConical: "FlaskConical (Biochemistry)",
  HeartPulse: "HeartPulse (Cardiology)",
  Microscope: "Microscope (Pathology)",
  Droplets: "Droplets (Haematology)",
  Zap: "Zap (Hormones)",
  Bug: "Bug (Microbiology)",
  Radiation: "Radiation (Radiology)",
  ShieldCheck: "ShieldCheck (Serology)",
  Clipboard: "Clipboard (Smears)",
  PackagePlus: "PackagePlus (Panels)",
  TestTube: "TestTube (General Test)",
  Layers: "Layers (Generic Category)",
  User: "User (Patients)", 
  UserCircle: "UserCircle (Alternative User)"
} as const;

export type IconName = keyof typeof availableIconsForCategories;
