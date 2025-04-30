
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegulatoryDashboard from '@/components/database/RegulatoryDashboard';
import RegulatoryUploader from '@/components/database/RegulatoryUploader';
import RegulatoryExplorer from '@/components/database/RegulatoryExplorer';
import RegulatorySearch from '@/components/database/RegulatorySearch';

const Database = () => {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-finance-dark-blue dark:text-white">Regulatory Database</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Upload, search, and manage regulatory content in the structured database
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="upload">Upload Content</TabsTrigger>
          <TabsTrigger value="explore">Explore Categories</TabsTrigger>
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-2">
          <RegulatoryDashboard />
        </TabsContent>
        
        <TabsContent value="upload" className="mt-2">
          <RegulatoryUploader />
        </TabsContent>
        
        <TabsContent value="explore" className="mt-2">
          <RegulatoryExplorer />
        </TabsContent>
        
        <TabsContent value="search" className="mt-2">
          <RegulatorySearch />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Database;
