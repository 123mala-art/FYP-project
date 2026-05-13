import React, { useState } from "react";
import { X, Settings, Code, Terminal, Eye, Type, Indent, WrapText, BarChart3, Clock, Zap, RotateCcw, Download, Keyboard, Palette, Sparkles } from "lucide-react";

const SettingsModal = ({
  isOpen,
  onClose,
  darkMode,
  fontSize,
  onFontSizeChange,
  tabSize,
  onTabSizeChange,
  insertSpaces,
  onInsertSpacesChange,
  showMinimap,
  onToggleMinimap,
  wordWrap,
  onToggleWordWrap,
  autoClearOutput = true,
  onToggleAutoClearOutput,
  showExecutionStats = true,
  onToggleExecutionStats,
  autoScrollOutput = true,
  onToggleAutoScrollOutput,
  autoSubmitInput = true,
  onToggleAutoSubmitInput,
  executionTimeout = 30,
  onExecutionTimeoutChange,
}) => {
  const [activeTab, setActiveTab] = useState('editor');

  if (!isOpen) return null;

  const tabs = [
    { id: 'editor', label: 'Editor', icon: Code, color: 'blue' },
    { id: 'formatting', label: 'Format', icon: WrapText, color: 'green' },
    { id: 'display', label: 'Display', icon: Eye, color: 'purple' },
    { id: 'execution', label: 'Execution', icon: Terminal, color: 'orange' }
  ];

  const SettingItem = ({ label, description, control, compact = false }) => (
    <div className={`flex items-center justify-between ${compact ? 'py-2' : 'py-3'}`}>
      <div className="flex-1 min-w-0">
        <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'} block truncate`}>
          {label}
        </label>
        {description && !compact && (
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'} leading-tight`}>
            {description}
          </p>
        )}
      </div>
      <div className="ml-3 flex-shrink-0">
        {control}
      </div>
    </div>
  );

  const CustomSelect = ({ value, onChange, options, compact = false }) => (
    <select
      value={value}
      onChange={onChange}
      className={`px-3 ${compact ? 'py-1.5' : 'py-2'} rounded-lg border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium min-w-[80px] ${darkMode
        ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500'
        : 'bg-white border-gray-300 hover:border-gray-400'
      }`}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );

  const CustomCheckbox = ({ checked, onChange, compact = false }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className={`border-2 rounded transition-all duration-200 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 ${darkMode ? 'peer-focus:ring-offset-gray-800' : 'peer-focus:ring-offset-white'} ${
        checked
          ? 'bg-blue-600 border-blue-600 shadow-sm'
          : darkMode ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-gray-100 border-gray-300 hover:border-gray-400'
      } ${compact ? 'w-4 h-4' : 'w-5 h-5'}`}>
        {checked && (
          <svg className={`text-white mx-auto ${compact ? 'w-2.5 h-2.5 mt-0.5' : 'w-3 h-3 mt-0.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </label>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'editor':
        return (
          <div className="space-y-4">
            <SettingItem
              label="Font Size"
              description="Adjust text size for better readability"
              control={
                <CustomSelect
                  value={fontSize}
                  onChange={(e) => onFontSizeChange?.(parseInt(e.target.value))}
                  options={[10, 11, 12, 13, 14, 15, 16, 18, 20, 24].map(size => ({ value: size, label: `${size}px` }))}
                />
              }
            />
            <SettingItem
              label="Tab Size"
              description="Set indentation width"
              control={
                <CustomSelect
                  value={tabSize}
                  onChange={(e) => onTabSizeChange?.(parseInt(e.target.value))}
                  options={[2, 4, 8].map(size => ({ value: size, label: size.toString() }))}
                />
              }
            />
          </div>
        );

      case 'formatting':
        return (
          <div className="space-y-4">
            <SettingItem
              label="Insert Spaces"
              description="Use spaces instead of tabs for indentation"
              control={
                <CustomCheckbox
                  checked={insertSpaces}
                  onChange={(e) => onInsertSpacesChange?.(e.target.checked)}
                />
              }
            />
            <SettingItem
              label="Word Wrap"
              description="Automatically wrap long lines"
              control={
                <CustomCheckbox
                  checked={wordWrap}
                  onChange={(e) => onToggleWordWrap?.(!wordWrap)}
                />
              }
            />
          </div>
        );

      case 'display':
        return (
          <div className="space-y-4">
            <SettingItem
              label="Minimap"
              description="Show code overview on the right side"
              control={
                <CustomCheckbox
                  checked={showMinimap}
                  onChange={(e) => onToggleMinimap?.(!showMinimap)}
                />
              }
            />
          </div>
        );

      case 'execution':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingItem
              label="Auto Clear"
              description="Clear output before each run"
              control={
                <CustomCheckbox
                  checked={autoClearOutput}
                  onChange={(e) => onToggleAutoClearOutput?.(!autoClearOutput)}
                  compact
                />
              }
              compact
            />
            <SettingItem
              label="Show Stats"
              description="Display execution time & memory"
              control={
                <CustomCheckbox
                  checked={showExecutionStats}
                  onChange={(e) => onToggleExecutionStats?.(!showExecutionStats)}
                  compact
                />
              }
              compact
            />
            <SettingItem
              label="Auto Scroll"
              description="Auto-scroll output to bottom"
              control={
                <CustomCheckbox
                  checked={autoScrollOutput}
                  onChange={(e) => onToggleAutoScrollOutput?.(!autoScrollOutput)}
                  compact
                />
              }
              compact
            />
            <SettingItem
              label="Auto Submit"
              description="Submit input with Enter key"
              control={
                <CustomCheckbox
                  checked={autoSubmitInput}
                  onChange={(e) => onToggleAutoSubmitInput?.(!autoSubmitInput)}
                  compact
                />
              }
              compact
            />
            <SettingItem
              label="Timeout"
              description="Maximum execution time"
              control={
                <CustomSelect
                  value={executionTimeout}
                  onChange={(e) => onExecutionTimeoutChange?.(parseInt(e.target.value))}
                  options={[5, 10, 15, 30, 60, 120].map(time => ({ value: time, label: `${time}s` }))}
                  compact
                />
              }
              compact
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'} overflow-hidden`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800' : 'border-gray-200 bg-gradient-to-r from-white to-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customize your experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`px-6 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const colorClasses = {
                blue: isActive ? 'bg-blue-600 text-white' : darkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50',
                green: isActive ? 'bg-green-600 text-white' : darkMode ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-50',
                purple: isActive ? 'bg-purple-600 text-white' : darkMode ? 'text-purple-400 hover:bg-purple-900/30' : 'text-purple-600 hover:bg-purple-50',
                orange: isActive ? 'bg-orange-600 text-white' : darkMode ? 'text-orange-400 hover:bg-orange-900/30' : 'text-orange-600 hover:bg-orange-50'
              };

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${colorClasses[tab.color]} ${isActive ? 'shadow-md' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
              darkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;