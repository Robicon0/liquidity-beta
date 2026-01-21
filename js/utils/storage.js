/**
 * Storage Utilities
 * LocalStorage management for editable data and preferences
 */

import { APP_CONFIG } from '../config/constants.js';

class StorageManager {
  constructor() {
    this.prefix = 'autotrack_';
  }

  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  }

  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  }

  /**
   * Clear all app data from localStorage
   */
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ All storage cleared');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Get storage size
   * @returns {number} Size in bytes
   */
  getSize() {
    let total = 0;
    try {
      for (const key in localStorage) {
        if (key.startsWith(this.prefix)) {
          total += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      console.error('Error calculating storage size:', error);
    }
    return total;
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if available
   */
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const storage = new StorageManager();

/**
 * Editable Data Manager
 * Manages user-editable position data
 */
class EditableDataManager {
  constructor() {
    this.storageKey = 'editable_data';
    this.data = this.load();
  }

  /**
   * Load editable data from storage
   * @returns {Object} Editable data
   */
  load() {
    return storage.get(this.storageKey, {
      positions: {},
      notes: {},
      customValues: {}
    });
  }

  /**
   * Save editable data to storage
   */
  save() {
    storage.set(this.storageKey, this.data);
  }

  /**
   * Set position note
   * @param {string} positionId - Position ID
   * @param {string} note - Note text
   */
  setNote(positionId, note) {
    this.data.notes[positionId] = note;
    this.save();
  }

  /**
   * Get position note
   * @param {string} positionId - Position ID
   * @returns {string} Note text
   */
  getNote(positionId) {
    return this.data.notes[positionId] || '';
  }

  /**
   * Set custom value for position field
   * @param {string} positionId - Position ID
   * @param {string} field - Field name
   * @param {*} value - Custom value
   */
  setCustomValue(positionId, field, value) {
    if (!this.data.customValues[positionId]) {
      this.data.customValues[positionId] = {};
    }
    this.data.customValues[positionId][field] = value;
    this.save();
  }

  /**
   * Get custom value for position field
   * @param {string} positionId - Position ID
   * @param {string} field - Field name
   * @returns {*} Custom value or null
   */
  getCustomValue(positionId, field) {
    return this.data.customValues[positionId]?.[field] || null;
  }

  /**
   * Remove custom value
   * @param {string} positionId - Position ID
   * @param {string} field - Field name
   */
  removeCustomValue(positionId, field) {
    if (this.data.customValues[positionId]) {
      delete this.data.customValues[positionId][field];
      this.save();
    }
  }

  /**
   * Get all editable data for a position
   * @param {string} positionId - Position ID
   * @returns {Object} Editable data
   */
  getPositionData(positionId) {
    return {
      note: this.getNote(positionId),
      customValues: this.data.customValues[positionId] || {}
    };
  }

  /**
   * Delete all data for a position
   * @param {string} positionId - Position ID
   */
  deletePosition(positionId) {
    delete this.data.notes[positionId];
    delete this.data.customValues[positionId];
    delete this.data.positions[positionId];
    this.save();
  }

  /**
   * Export all editable data
   * @returns {string} JSON string
   */
  export() {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Import editable data
   * @param {string} jsonData - JSON string
   * @returns {boolean} Success status
   */
  import(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      this.data = imported;
      this.save();
      console.log('✅ Editable data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Error importing editable data:', error);
      return false;
    }
  }

  /**
   * Clear all editable data
   */
  clear() {
    this.data = {
      positions: {},
      notes: {},
      customValues: {}
    };
    this.save();
    console.log('🗑️ All editable data cleared');
  }
}

// Export singleton instance
export const editableData = new EditableDataManager();

/**
 * Preferences Manager
 * Manages user preferences
 */
class PreferencesManager {
  constructor() {
    this.storageKey = 'preferences';
    this.preferences = this.load();
  }

  /**
   * Load preferences from storage
   * @returns {Object} Preferences
   */
  load() {
    return storage.get(this.storageKey, {
      theme: 'dark',
      currency: 'USD',
      decimals: 2,
      showClosedPositions: false,
      defaultChain: 'ethereum',
      autoRefresh: true,
      refreshInterval: 60000,
      notifications: true
    });
  }

  /**
   * Save preferences to storage
   */
  save() {
    storage.set(this.storageKey, this.preferences);
  }

  /**
   * Get preference value
   * @param {string} key - Preference key
   * @param {*} defaultValue - Default value
   * @returns {*} Preference value
   */
  get(key, defaultValue = null) {
    return this.preferences[key] !== undefined ? this.preferences[key] : defaultValue;
  }

  /**
   * Set preference value
   * @param {string} key - Preference key
   * @param {*} value - Value
   */
  set(key, value) {
    this.preferences[key] = value;
    this.save();
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.preferences = this.load();
    storage.remove(this.storageKey);
    console.log('🔄 Preferences reset to defaults');
  }
}

// Export singleton instance
export const preferences = new PreferencesManager();
