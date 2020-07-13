package com.arboliot;

import android.app.Application;

import com.facebook.react.ReactApplication;
import fr.bamlab.rnimageresizer.ImageResizerPackage;
import com.github.yamill.orientation.OrientationPackage;
import fr.greweb.reactnativeviewshot.RNViewShotPackage;
import com.dylanvann.fastimage.FastImageViewPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.transistorsoft.rnbackgroundfetch.RNBackgroundFetchPackage;
import com.facebook.reactnative.androidsdk.FBSDKPackage;
import io.invertase.firebase.RNFirebasePackage;
import co.apptailor.googlesignin.RNGoogleSigninPackage;
import cl.json.RNSharePackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.terrylinla.rnsketchcanvas.SketchCanvasPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.imagepicker.ImagePickerPackage;
import com.airbnb.android.react.maps.MapsPackage;
import com.horcrux.svg.SvgPackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import com.babisoft.ReactNativeLocalization.ReactNativeLocalizationPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.wix.RNCameraKit.RNCameraKitPackage;
import java.util.Arrays;
import java.util.List;
import com.facebook.CallbackManager;

public class MainApplication extends Application implements ReactApplication {

  private static CallbackManager mCallbackManager = CallbackManager.Factory.create();

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new ImageResizerPackage(),
            new OrientationPackage(),
            new RNViewShotPackage(),
            new FastImageViewPackage(),
            new NetInfoPackage(),
            new RNBackgroundFetchPackage(),
            new FBSDKPackage(mCallbackManager),
            new RNFirebasePackage(),
            new RNGoogleSigninPackage(),
            new RNSharePackage(),
            new RNFetchBlobPackage(),
            new SketchCanvasPackage(),
            new VectorIconsPackage(),
            new ImagePickerPackage(),
            new MapsPackage(),
            new SvgPackage(),
            new ReactNativeLocalizationPackage(),
            new LinearGradientPackage(),
            new RNGestureHandlerPackage(),
            new RNCameraKitPackage(),
            new RNFirebaseMessagingPackage(),
            new RNFirebaseNotificationsPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  protected static CallbackManager getCallbackManager() {
    return mCallbackManager;
  }

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
