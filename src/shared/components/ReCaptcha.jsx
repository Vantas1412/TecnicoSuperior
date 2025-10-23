import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const ReCaptcha = forwardRef(({ onVerify, onExpired, onError, verified, theme = 'light', size = 'normal' }, ref) => {
  const recaptchaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      return recaptchaRef.current ? recaptchaRef.current.getValue() : null;
    },
    reset: () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    }
  }));

  const handleChange = (value) => {
    if (onVerify) {
      onVerify(value);
    }
  };

  const handleExpired = () => {
    if (onExpired) {
      onExpired();
    }
  };

  const handleError = () => {
    if (onError) {
      onError();
    }
  };

  return (
    <div className="flex justify-center">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        onChange={handleChange}
        onExpired={handleExpired}
        onError={handleError}
        theme={theme}
        size={size}
      />
    </div>
  );
});

ReCaptcha.displayName = 'ReCaptcha';

export default ReCaptcha;
