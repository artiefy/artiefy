/** @type {import('next-video/video-config').VideoConfig} */
module.exports = {
	provider: 'amazon-s3',
	providerConfig: {
		endpoint: 'https://s3.us-east-2.amazonaws.com',
		bucket: 'artiefy-upload',
	},
};
