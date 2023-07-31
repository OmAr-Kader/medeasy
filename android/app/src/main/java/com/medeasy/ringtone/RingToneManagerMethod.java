package com.medeasy.ringtone;

import android.annotation.SuppressLint;
import android.provider.Settings;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import android.net.Uri;
import android.media.RingtoneManager;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;

public class RingToneManagerMethod extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;
    
    RingToneManagerMethod(ReactApplicationContext context) {
       super(context);
        reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "RingToneManagerMethod";
    }

    @ReactMethod
    public void getDefaultRingtoneUri(Promise response) {
        try {
            Uri defaultRingtoneUri = RingtoneManager.getActualDefaultRingtoneUri(reactContext, RingtoneManager.TYPE_RINGTONE);
            String tittle = android.media.RingtoneManager.getRingtone(reactContext,defaultRingtoneUri).getTitle(reactContext);
            String channelId = "appointment-ring-channel";//answered ? 'appointment-answered-channel' : 'appointment-ring-channel';
            
            android.app.NotificationChannel notificationChannel = new android.app.NotificationChannel(channelId, "Appointment Channel", android.app.NotificationManager.IMPORTANCE_HIGH);
            notificationChannel.enableLights(true);
            notificationChannel.enableVibration(true);
            notificationChannel.setDescription("A channel to categories your appointment notifications");
            notificationChannel.setVibrationPattern(new long[]{100, 200, 300, 400, 500, 400, 300, 200, 400});
            android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build();
            notificationChannel.setSound(defaultRingtoneUri,audioAttributes);
            android.app.NotificationManager mNotificationManager = (android.app.NotificationManager) reactContext.getSystemService(android.content.Context.NOTIFICATION_SERVICE);

            mNotificationManager.createNotificationChannel(notificationChannel);
            
            WritableArray resultData = Arguments.createArray();
            resultData.pushString( defaultRingtoneUri.toString());
            resultData.pushString(tittle);
            response.resolve(resultData);
        } catch (Exception e) {
            response.reject("Error", e);
        }
    }
}