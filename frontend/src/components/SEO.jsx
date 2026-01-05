import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, url, image, type = 'website' }) => {
  const siteTitle = "6ixminds Labs - Innovative Tech Solutions";
  const defaultDescription = "6ixminds Labs delivers cutting-edge technology solutions, specializing in web development, AI integration, and digital transformation.";
  const siteUrl = "https://www.6ixmindslabs.in";
  const defaultImage = `${siteUrl}/logo2.png`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title ? `${title} | 6ixminds Labs` : siteTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords ? keywords : "web development, AI, tech solutions, 6ixminds Labs,sixmindslabs,6ixmindslab,"} />
      <link rel="canonical" href={url ? `${siteUrl}${url}` : siteUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url ? `${siteUrl}${url}` : siteUrl} />
      <meta property="og:title" content={title ? `${title} | 6ixminds Labs` : siteTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image || defaultImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url ? `${siteUrl}${url}` : siteUrl} />
      <meta name="twitter:title" content={title ? `${title} | 6ixminds Labs` : siteTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
};

export default SEO;
