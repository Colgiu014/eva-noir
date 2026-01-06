# Firebase Ads Setup Guide

## ⚠️ Important Security Note

**Admin Panel URL**: `/manage-7x9k2p4a`

This is a security-hardened URL that's difficult to guess. Keep this URL confidential and only share it with authorized administrators. The obscure path provides an additional layer of security beyond authentication.

## Overview

This application includes a complete ad management system powered by Firebase Firestore. Admins can create, manage, and track ads, while users see them integrated naturally into the chat experience.

## Features

- 🎯 **Ad Placement Options**: Top, Middle, Bottom, and Sidebar placements
- 📊 **Analytics Tracking**: Automatic tracking of impressions and clicks
- 🎨 **Customizable Ads**: Support for images, titles, descriptions, and custom CTAs
- 🔄 **Real-time Updates**: Ads update instantly when created or modified
- 🎛️ **Admin Dashboard**: Complete CRUD interface for ad management
- 📈 **CTR Tracking**: Click-through rate calculations

## Firestore Structure

### Collection: `ads`

Each ad document contains:

```javascript
{
  title: string,              // Ad title
  description: string,        // Ad description
  imageUrl: string,           // Optional image URL
  linkUrl: string,            // Target URL when ad is clicked
  buttonText: string,         // CTA button text
  placement: string,          // 'top' | 'middle' | 'bottom' | 'sidebar'
  isActive: boolean,          // Whether ad is currently shown
  impressions: number,        // Number of times ad was viewed
  clicks: number,             // Number of times ad was clicked
  createdAt: Timestamp,       // Creation date
  updatedAt: Timestamp        // Last update date
}
```

## Firestore Security Rules

Add these rules to your Firestore security rules to protect the ads collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Ads collection
    match /ads/{adId} {
      // Anyone can read active ads
      allow read: if resource.data.isActive == true;
      
      // Only admins can read inactive ads
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Only admins can write (create, update, delete)
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Firestore Indexes

Create this composite index in Firebase Console:

1. Go to Firestore Database → Indexes
2. Click "Create Index"
3. Configure:
   - **Collection ID**: `ads`
   - **Fields to index**:
     - `isActive` - Ascending
     - `placement` - Ascending
     - `createdAt` - Descending
   - **Query scope**: Collection

## Setup Instructions

### 1. Enable Firestore

If you haven't already:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Firestore Database" in the left menu
4. Click "Create database"
5. Choose production mode or test mode
6. Select your database location

### 2. Create the Ads Collection

The collection will be created automatically when you create your first ad. However, you can also create it manually:

1. In Firestore Database, click "Start collection"
2. Collection ID: `ads`
3. Click "Next"
4. Add a test document (you can delete it later)

### 3. Access the Admin Dashboard

1. Make sure you have an admin user (check `FIREBASE_SETUP.md` for creating admin users)
2. Log in as an admin
3. Navigate to `/manage-7x9k2p4a` (admin panel - keep this URL secure!)
4. Click "📢 Manage Ads" button
5. Create your first ad

### 4. Create Your First Ad

In the Ads Management page:

1. Click "+ Create Ad"
2. Fill in the form:
   - **Title**: "Get 50% Off Premium!"
   - **Description**: "Upgrade now and save on your first month"
   - **Link URL**: "https://example.com/premium"
   - **Button Text**: "Learn More"
   - **Image URL**: (optional) URL to an image
   - **Placement**: Choose where to show the ad
   - **Status**: Check "Active" to enable
3. Click "Create Ad"

## Ad Placements

### Available Placements

1. **Top**: Displays at the top of the chat messages
2. **Bottom**: Displays at the bottom of the chat messages
3. **Middle**: Can be implemented in message list (not yet added)
4. **Sidebar**: Can be implemented in a sidebar (not yet added)

### Current Implementation

Ads are currently integrated into:
- `/app/chat/page.tsx` - Chat page (top and bottom placements)

### Adding Ads to Other Pages

To add ads to other pages:

```tsx
import { useEffect, useState } from "react";
import { getActiveAds } from "@/lib/ads";
import { Ad as AdType } from "@/lib/types";
import AdComponent from "@/components/Ad";

export default function YourPage() {
  const [ads, setAds] = useState<AdType[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      const fetchedAds = await getActiveAds('top'); // or 'middle', 'bottom', 'sidebar'
      setAds(fetchedAds);
    };
    fetchAds();
  }, []);

  return (
    <div>
      {ads.length > 0 && <AdComponent ad={ads[0]} />}
      {/* Your page content */}
    </div>
  );
}
```

## Analytics & Tracking

### Automatic Tracking

The system automatically tracks:
- **Impressions**: When an ad is displayed to a user
- **Clicks**: When a user clicks on an ad

### View Analytics

1. Go to Admin Dashboard → Manage Ads
2. View the "Stats" column for each ad:
   - 👁️ Impressions (views)
   - 🖱️ Clicks
   - CTR (Click-Through Rate) percentage

### Exporting Data

To export ad data for further analysis, you can:

1. Use Firebase Console to export Firestore data
2. Create a custom admin endpoint to export as CSV/JSON
3. Use Firebase Admin SDK to query and export data

## Ad Management

### Creating Ads

1. Navigate to `/manage-7x9k2p4a/ads`
2. Click "+ Create Ad"
3. Fill in all required fields
4. Click "Create Ad"

### Editing Ads

1. Find the ad in the list
2. Click "Edit"
3. Modify fields as needed
4. Click "Update Ad"

### Activating/Deactivating Ads

Click the status badge (Active/Inactive) to toggle the ad's visibility.

### Deleting Ads

1. Click "Delete" next to an ad
2. Confirm the deletion

## Best Practices

### 1. Ad Design

- Keep titles short and engaging (max 50 characters)
- Write clear, benefit-focused descriptions
- Use high-quality images (recommended: 200x200px or larger)
- Make CTAs action-oriented ("Get Started", "Learn More", "Try Free")

### 2. Ad Placement

- **Top**: Best for important announcements or premium features
- **Bottom**: Good for non-intrusive promotions
- **Limit active ads**: Don't show too many ads at once

### 3. Performance Monitoring

- Check CTR regularly (aim for 1-5% for display ads)
- Deactivate underperforming ads
- A/B test different titles and descriptions
- Update ads regularly to maintain engagement

### 4. User Experience

- Don't show too many ads simultaneously
- Ensure ads are relevant to your audience
- Make sure ads are mobile-responsive
- Test ad load times with images

## Troubleshooting

### Ads not showing

1. Check that at least one ad is set to "Active"
2. Verify the placement matches where you're looking
3. Check browser console for errors
4. Verify Firestore security rules allow reading active ads

### Can't create/edit ads

1. Verify you're logged in as an admin user
2. Check Firestore security rules allow admin write access
3. Ensure all required fields are filled
4. Check browser console for errors

### Impressions/clicks not tracking

1. Verify Firestore security rules allow updating ads
2. Check browser console for errors
3. Ensure the ad ID is valid
4. Check network tab for failed Firestore requests

## Advanced Features (Future Enhancements)

Consider implementing:

- **Scheduling**: Set start and end dates for campaigns
- **Targeting**: Show different ads to different user segments
- **A/B Testing**: Test multiple ad variations
- **Budget Caps**: Limit impressions per day/week
- **Geographic Targeting**: Show ads based on user location
- **Priority/Rotation**: Control ad display order and rotation
- **External Ad Networks**: Integrate Google AdSense or other networks

## API Reference

### Functions

See `/lib/ads.ts` for all available functions:

- `getActiveAds(placement)` - Fetch active ads for a placement
- `getAllAds()` - Fetch all ads (admin only)
- `trackAdImpression(adId)` - Track an ad view
- `trackAdClick(adId)` - Track an ad click
- `createAd(adData)` - Create a new ad
- `updateAd(adId, adData)` - Update an existing ad
- `deleteAd(adId)` - Delete an ad
- `toggleAdStatus(adId, isActive)` - Toggle ad active state

## Support

For issues or questions:
1. Check this documentation
2. Review Firebase Console for errors
3. Check browser console for client-side errors
4. Review Firestore security rules
