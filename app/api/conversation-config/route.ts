import { NextRequest, NextResponse } from 'next/server';
import { 
  loadConfig, 
  saveConfig, 
  addLocation, 
  removeLocation, 
  getAllLocations,
  getLocationConfig,
  type ConversationProcessingConfig 
} from '@/lib/config-loader';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'get';
  
  try {
    switch (action) {
      case 'get':
        const config = loadConfig();
        return NextResponse.json({
          success: true,
          action: 'get',
          config
        });

      case 'locations':
        const locations = getAllLocations();
        return NextResponse.json({
          success: true,
          action: 'locations',
          locations,
          count: locations.length
        });

      case 'check':
        const chainId = searchParams.get('chainId');
        const locationId = searchParams.get('locationId');
        
        if (!chainId || !locationId) {
          return NextResponse.json(
            { error: 'chainId and locationId are required for check action' },
            { status: 400 }
          );
        }

        const locationConfig = getLocationConfig(chainId, locationId);
        return NextResponse.json({
          success: true,
          action: 'check',
          chainId,
          locationId,
          configured: locationConfig.found,
          chainConfig: locationConfig.chainConfig
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in config GET:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get configuration',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, chainId, locationId, config } = body;

    switch (action) {
      case 'save':
        if (!config) {
          return NextResponse.json(
            { error: 'config is required for save action' },
            { status: 400 }
          );
        }

        const saveSuccess = saveConfig(config as ConversationProcessingConfig);
        return NextResponse.json({
          success: saveSuccess,
          action: 'save',
          message: saveSuccess ? 'Configuration saved successfully' : 'Failed to save configuration'
        });

      case 'add-location':
        if (!chainId || !locationId) {
          return NextResponse.json(
            { error: 'chainId and locationId are required for add-location action' },
            { status: 400 }
          );
        }

        const addSuccess = addLocation(chainId, locationId);
        return NextResponse.json({
          success: addSuccess,
          action: 'add-location',
          chainId,
          locationId,
          message: addSuccess 
            ? `Location ${chainId}/${locationId} added successfully`
            : `Failed to add location ${chainId}/${locationId}`
        });

      case 'remove-location':
        if (!chainId || !locationId) {
          return NextResponse.json(
            { error: 'chainId and locationId are required for remove-location action' },
            { status: 400 }
          );
        }

        const removeSuccess = removeLocation(chainId, locationId);
        return NextResponse.json({
          success: removeSuccess,
          action: 'remove-location',
          chainId,
          locationId,
          message: removeSuccess 
            ? `Location ${chainId}/${locationId} removed successfully`
            : `Failed to remove location ${chainId}/${locationId}`
        });

      case 'update-settings':
        const currentConfig = loadConfig();
        const updatedConfig = {
          ...currentConfig,
          ...(body.openaiSettings && { openaiSettings: { ...currentConfig.openaiSettings, ...body.openaiSettings } }),
          ...(body.clusteringSettings && { clusteringSettings: { ...currentConfig.clusteringSettings, ...body.clusteringSettings } }),
          ...(body.dataSettings && { dataSettings: { ...currentConfig.dataSettings, ...body.dataSettings } }),
          ...(body.processingOptions && { 
            processingConfig: { 
              ...currentConfig.processingConfig, 
              options: { ...currentConfig.processingConfig.options, ...body.processingOptions }
            }
          })
        };

        const updateSuccess = saveConfig(updatedConfig);
        return NextResponse.json({
          success: updateSuccess,
          action: 'update-settings',
          message: updateSuccess ? 'Settings updated successfully' : 'Failed to update settings',
          config: updateSuccess ? updatedConfig : undefined
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in config POST:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update configuration',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const config = await request.json() as ConversationProcessingConfig;
    
    // Validate the configuration structure
    if (!config.processingConfig || !config.targetStages) {
      return NextResponse.json(
        { error: 'Invalid configuration structure' },
        { status: 400 }
      );
    }

    const success = saveConfig(config);
    
    return NextResponse.json({
      success,
      message: success ? 'Configuration updated successfully' : 'Failed to update configuration',
      config: success ? config : undefined
    });

  } catch (error: any) {
    console.error('Error updating config:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update configuration',
        message: error.message
      },
      { status: 500 }
    );
  }
}