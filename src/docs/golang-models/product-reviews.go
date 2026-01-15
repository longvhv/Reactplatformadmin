package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// PRODUCT REVIEW - Customer Reviews & Ratings
// ============================================================================
// Purpose: Customer reviews and ratings for products
// Table: product_reviews
// Primary Key: _id (UUID)
// Features: Star ratings, Verified purchases, Helpful votes, Moderation
// ============================================================================

// ReviewStatus represents the review moderation status
type ReviewStatus string

const (
	ReviewStatusPending   ReviewStatus = "PENDING"   // Awaiting moderation
	ReviewStatusApproved  ReviewStatus = "APPROVED"  // Approved and visible
	ReviewStatusRejected  ReviewStatus = "REJECTED"  // Rejected
	ReviewStatusFlagged   ReviewStatus = "FLAGGED"   // Flagged for review
	ReviewStatusHidden    ReviewStatus = "HIDDEN"    // Hidden by admin
)

type ProductReview struct {
	// Identity (4 fields)
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ProductID  uuid.UUID  `gorm:"column:product_id;type:uuid;not null;index" json:"product_id"`
	VariantID  *uuid.UUID `gorm:"column:variant_id;type:uuid;index" json:"variant_id,omitempty"`
	CustomerID uuid.UUID  `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`

	// Review Content (5 fields)
	Rating      int     `gorm:"column:rating;type:int;not null;index" json:"rating"` // 1-5 stars
	Title       *string `gorm:"column:title;type:varchar(255)" json:"title,omitempty"`
	Comment     *string `gorm:"column:comment;type:text" json:"comment,omitempty"`
	Pros        *string `gorm:"column:pros;type:text" json:"pros,omitempty"`
	Cons        *string `gorm:"column:cons;type:text" json:"cons,omitempty"`

	// Verification (3 fields)
	IsVerifiedPurchase bool       `gorm:"column:is_verified_purchase;default:false;index" json:"is_verified_purchase"`
	OrderID            *uuid.UUID `gorm:"column:order_id;type:uuid;index" json:"order_id,omitempty"`
	PurchaseDate       *time.Time `gorm:"column:purchase_date" json:"purchase_date,omitempty"`

	// Moderation (3 fields)
	Status       ReviewStatus `gorm:"column:status;type:varchar(20);default:'PENDING';index" json:"status"`
	ModeratedAt  *time.Time   `gorm:"column:moderated_at" json:"moderated_at,omitempty"`
	ModeratedBy  *uuid.UUID   `gorm:"column:moderated_by;type:uuid" json:"moderated_by,omitempty"`

	// Engagement (3 fields)
	HelpfulCount   int `gorm:"column:helpful_count;default:0" json:"helpful_count"`
	UnhelpfulCount int `gorm:"column:unhelpful_count;default:0" json:"unhelpful_count"`
	ReportCount    int `gorm:"column:report_count;default:0" json:"report_count"`

	// Response (3 fields)
	HasSellerResponse  bool       `gorm:"column:has_seller_response;default:false" json:"has_seller_response"`
	SellerResponse     *string    `gorm:"column:seller_response;type:text" json:"seller_response,omitempty"`
	SellerRespondedAt  *time.Time `gorm:"column:seller_responded_at" json:"seller_responded_at,omitempty"`

	// Media (2 fields)
	Images StringArray `gorm:"column:images;type:text[]" json:"images,omitempty"`
	Videos StringArray `gorm:"column:videos;type:text[]" json:"videos,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationships
	Product *Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Variant *ProductVariant `gorm:"foreignKey:VariantID" json:"variant,omitempty"`
}

func (ProductReview) TableName() string {
	return "product_reviews"
}

// Validate validates the review
func (pr *ProductReview) Validate() error {
	if pr.Rating < 1 || pr.Rating > 5 {
		return errors.New("rating must be between 1 and 5")
	}
	if pr.Title != nil && len(*pr.Title) > 255 {
		return errors.New("title must be <= 255 characters")
	}
	return nil
}

// IsApproved checks if the review is approved
func (pr *ProductReview) IsApproved() bool {
	return pr.Status == ReviewStatusApproved && pr.DeletedAt == nil
}

// Approve approves the review
func (pr *ProductReview) Approve(moderatorID uuid.UUID) {
	now := time.Now()
	pr.Status = ReviewStatusApproved
	pr.ModeratedAt = &now
	pr.ModeratedBy = &moderatorID
}

// Reject rejects the review
func (pr *ProductReview) Reject(moderatorID uuid.UUID) {
	now := time.Now()
	pr.Status = ReviewStatusRejected
	pr.ModeratedAt = &now
	pr.ModeratedBy = &moderatorID
}

// Flag flags the review for moderation
func (pr *ProductReview) Flag() {
	pr.Status = ReviewStatusFlagged
	pr.ReportCount++
}

// MarkHelpful marks the review as helpful
func (pr *ProductReview) MarkHelpful() {
	pr.HelpfulCount++
}

// MarkUnhelpful marks the review as unhelpful
func (pr *ProductReview) MarkUnhelpful() {
	pr.UnhelpfulCount++
}

// GetHelpfulnessRatio returns the helpfulness ratio
func (pr *ProductReview) GetHelpfulnessRatio() float64 {
	total := pr.HelpfulCount + pr.UnhelpfulCount
	if total == 0 {
		return 0
	}
	return (float64(pr.HelpfulCount) / float64(total)) * 100
}

// AddSellerResponse adds a seller response
func (pr *ProductReview) AddSellerResponse(response string) {
	now := time.Now()
	pr.SellerResponse = &response
	pr.SellerRespondedAt = &now
	pr.HasSellerResponse = true
}

// ============================================================================
// REVIEW VOTE - Track helpful/unhelpful votes
// ============================================================================

type VoteType string

const (
	VoteTypeHelpful   VoteType = "HELPFUL"
	VoteTypeUnhelpful VoteType = "UNHELPFUL"
)

type ReviewVote struct {
	// Identity (3 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ReviewID   uuid.UUID `gorm:"column:review_id;type:uuid;not null;index" json:"review_id"`
	CustomerID uuid.UUID `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`

	// Vote (1 field)
	VoteType VoteType `gorm:"column:vote_type;type:varchar(20);not null" json:"vote_type"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Review *ProductReview `gorm:"foreignKey:ReviewID" json:"review,omitempty"`
}

func (ReviewVote) TableName() string {
	return "review_votes"
}

// ============================================================================
// REVIEW REPORT - Report inappropriate reviews
// ============================================================================

type ReportReason string

const (
	ReportReasonSpam          ReportReason = "SPAM"
	ReportReasonOffensive     ReportReason = "OFFENSIVE"
	ReportReasonFake          ReportReason = "FAKE"
	ReportReasonIrrelevant    ReportReason = "IRRELEVANT"
	ReportReasonMisleading    ReportReason = "MISLEADING"
	ReportReasonOther         ReportReason = "OTHER"
)

type ReviewReport struct {
	// Identity (3 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ReviewID   uuid.UUID `gorm:"column:review_id;type:uuid;not null;index" json:"review_id"`
	ReporterID uuid.UUID `gorm:"column:reporter_id;type:uuid;not null;index" json:"reporter_id"`

	// Report (3 fields)
	Reason      ReportReason `gorm:"column:reason;type:varchar(50);not null" json:"reason"`
	Description *string      `gorm:"column:description;type:text" json:"description,omitempty"`
	Status      string       `gorm:"column:status;type:varchar(20);default:'PENDING'" json:"status"` // pending, reviewed, resolved

	// Resolution (2 fields)
	ReviewedAt  *time.Time `gorm:"column:reviewed_at" json:"reviewed_at,omitempty"`
	ReviewedBy  *uuid.UUID `gorm:"column:reviewed_by;type:uuid" json:"reviewed_by,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Review *ProductReview `gorm:"foreignKey:ReviewID" json:"review,omitempty"`
}

func (ReviewReport) TableName() string {
	return "review_reports"
}

// ============================================================================
// PRODUCT RATING SUMMARY - Aggregated Ratings
// ============================================================================
// Type: Computed/View (not a table, calculated on-demand or cached)

type ProductRatingSummary struct {
	ProductID uuid.UUID `json:"product_id"`

	// Overall (2 fields)
	AverageRating float64 `json:"average_rating"`
	TotalReviews  int64   `json:"total_reviews"`

	// Star Distribution (5 fields)
	FiveStarCount  int64 `json:"five_star_count"`
	FourStarCount  int64 `json:"four_star_count"`
	ThreeStarCount int64 `json:"three_star_count"`
	TwoStarCount   int64 `json:"two_star_count"`
	OneStarCount   int64 `json:"one_star_count"`

	// Percentages (5 fields)
	FiveStarPercent  float64 `json:"five_star_percent"`
	FourStarPercent  float64 `json:"four_star_percent"`
	ThreeStarPercent float64 `json:"three_star_percent"`
	TwoStarPercent   float64 `json:"two_star_percent"`
	OneStarPercent   float64 `json:"one_star_percent"`

	// Additional (3 fields)
	VerifiedPurchaseCount int64     `json:"verified_purchase_count"`
	WithImagesCount       int64     `json:"with_images_count"`
	LastReviewedAt        *time.Time `json:"last_reviewed_at,omitempty"`
}

// CalculateProductRatingSummary calculates rating summary for a product
func CalculateProductRatingSummary(db *gorm.DB, productID uuid.UUID) (*ProductRatingSummary, error) {
	summary := &ProductRatingSummary{
		ProductID: productID,
	}

	// Get approved reviews only
	var reviews []ProductReview
	err := db.Where("product_id = ? AND status = ? AND deleted_at IS NULL",
		productID, ReviewStatusApproved).Find(&reviews).Error
	if err != nil {
		return nil, err
	}

	summary.TotalReviews = int64(len(reviews))

	if summary.TotalReviews == 0 {
		return summary, nil
	}

	// Calculate star counts
	var totalRating float64
	for _, review := range reviews {
		totalRating += float64(review.Rating)

		switch review.Rating {
		case 5:
			summary.FiveStarCount++
		case 4:
			summary.FourStarCount++
		case 3:
			summary.ThreeStarCount++
		case 2:
			summary.TwoStarCount++
		case 1:
			summary.OneStarCount++
		}

		if review.IsVerifiedPurchase {
			summary.VerifiedPurchaseCount++
		}

		if len(review.Images) > 0 {
			summary.WithImagesCount++
		}

		if summary.LastReviewedAt == nil || review.CreatedAt.After(*summary.LastReviewedAt) {
			summary.LastReviewedAt = &review.CreatedAt
		}
	}

	// Calculate average
	summary.AverageRating = totalRating / float64(summary.TotalReviews)

	// Calculate percentages
	summary.FiveStarPercent = (float64(summary.FiveStarCount) / float64(summary.TotalReviews)) * 100
	summary.FourStarPercent = (float64(summary.FourStarCount) / float64(summary.TotalReviews)) * 100
	summary.ThreeStarPercent = (float64(summary.ThreeStarCount) / float64(summary.TotalReviews)) * 100
	summary.TwoStarPercent = (float64(summary.TwoStarCount) / float64(summary.TotalReviews)) * 100
	summary.OneStarPercent = (float64(summary.OneStarCount) / float64(summary.TotalReviews)) * 100

	return summary, nil
}

// ============================================================================
// REVIEW MEDIA - Review Images/Videos
// ============================================================================

type ReviewMedia struct {
	// Identity (2 fields)
	ID       uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ReviewID uuid.UUID `gorm:"column:review_id;type:uuid;not null;index" json:"review_id"`

	// Media (4 fields)
	MediaType string  `gorm:"column:media_type;type:varchar(20);not null" json:"media_type"` // image, video
	URL       string  `gorm:"column:url;type:text;not null" json:"url"`
	Thumbnail *string `gorm:"column:thumbnail;type:text" json:"thumbnail,omitempty"`
	Order     int     `gorm:"column:order;default:0" json:"order"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationship
	Review *ProductReview `gorm:"foreignKey:ReviewID" json:"review,omitempty"`
}

func (ReviewMedia) TableName() string {
	return "review_media"
}

// ============================================================================
// PRODUCT QUESTION - Q&A for products
// ============================================================================

type QuestionStatus string

const (
	QuestionStatusPending  QuestionStatus = "PENDING"
	QuestionStatusAnswered QuestionStatus = "ANSWERED"
	QuestionStatusClosed   QuestionStatus = "CLOSED"
)

type ProductQuestion struct {
	// Identity (3 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ProductID  uuid.UUID `gorm:"column:product_id;type:uuid;not null;index" json:"product_id"`
	CustomerID uuid.UUID `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`

	// Question (2 fields)
	Question string         `gorm:"column:question;type:text;not null" json:"question"`
	Status   QuestionStatus `gorm:"column:status;type:varchar(20);default:'PENDING'" json:"status"`

	// Engagement (2 fields)
	HelpfulCount int `gorm:"column:helpful_count;default:0" json:"helpful_count"`
	AnswerCount  int `gorm:"column:answer_count;default:0" json:"answer_count"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationships
	Product *Product           `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Answers []ProductAnswer    `gorm:"foreignKey:QuestionID" json:"answers,omitempty"`
}

func (ProductQuestion) TableName() string {
	return "product_questions"
}

// ============================================================================
// PRODUCT ANSWER - Answers to questions
// ============================================================================

type ProductAnswer struct {
	// Identity (3 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	QuestionID uuid.UUID `gorm:"column:question_id;type:uuid;not null;index" json:"question_id"`
	AnswererID uuid.UUID `gorm:"column:answerer_id;type:uuid;not null;index" json:"answerer_id"`

	// Answer (3 fields)
	Answer          string `gorm:"column:answer;type:text;not null" json:"answer"`
	IsSellerAnswer  bool   `gorm:"column:is_seller_answer;default:false" json:"is_seller_answer"`
	IsVerifiedBuyer bool   `gorm:"column:is_verified_buyer;default:false" json:"is_verified_buyer"`

	// Engagement (2 fields)
	HelpfulCount   int `gorm:"column:helpful_count;default:0" json:"helpful_count"`
	UnhelpfulCount int `gorm:"column:unhelpful_count;default:0" json:"unhelpful_count"`

	// Moderation (2 fields)
	Status      ReviewStatus `gorm:"column:status;type:varchar(20);default:'PENDING'" json:"status"`
	ModeratedAt *time.Time   `gorm:"column:moderated_at" json:"moderated_at,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationship
	Question *ProductQuestion `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

func (ProductAnswer) TableName() string {
	return "product_answers"
}

// ============================================================================
// Helper Functions
// ============================================================================

// GetProductReviews gets reviews for a product with filters
func GetProductReviews(db *gorm.DB, productID uuid.UUID, status ReviewStatus, limit int, offset int) ([]ProductReview, error) {
	var reviews []ProductReview
	query := db.Where("product_id = ? AND status = ? AND deleted_at IS NULL", productID, status).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset)

	err := query.Find(&reviews).Error
	return reviews, err
}

// GetTopReviews gets most helpful reviews
func GetTopReviews(db *gorm.DB, productID uuid.UUID, limit int) ([]ProductReview, error) {
	var reviews []ProductReview
	err := db.Where("product_id = ? AND status = ? AND deleted_at IS NULL", 
		productID, ReviewStatusApproved).
		Order("helpful_count DESC, created_at DESC").
		Limit(limit).
		Find(&reviews).Error
	return reviews, err
}

// GetVerifiedPurchaseReviews gets reviews from verified purchases
func GetVerifiedPurchaseReviews(db *gorm.DB, productID uuid.UUID, limit int) ([]ProductReview, error) {
	var reviews []ProductReview
	err := db.Where("product_id = ? AND status = ? AND is_verified_purchase = ? AND deleted_at IS NULL",
		productID, ReviewStatusApproved, true).
		Order("created_at DESC").
		Limit(limit).
		Find(&reviews).Error
	return reviews, err
}

// VoteOnReview records a vote on a review
func VoteOnReview(db *gorm.DB, reviewID, customerID uuid.UUID, voteType VoteType) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Check if user already voted
		var existingVote ReviewVote
		err := tx.Where("review_id = ? AND customer_id = ?", reviewID, customerID).
			First(&existingVote).Error

		if err == nil {
			// Update existing vote
			if existingVote.VoteType == voteType {
				return nil // Already voted this way
			}

			// Change vote
			var review ProductReview
			if err := tx.First(&review, reviewID).Error; err != nil {
				return err
			}

			// Decrease old vote
			if existingVote.VoteType == VoteTypeHelpful {
				review.HelpfulCount--
			} else {
				review.UnhelpfulCount--
			}

			// Increase new vote
			if voteType == VoteTypeHelpful {
				review.HelpfulCount++
			} else {
				review.UnhelpfulCount++
			}

			if err := tx.Save(&review).Error; err != nil {
				return err
			}

			// Update vote record
			existingVote.VoteType = voteType
			return tx.Save(&existingVote).Error

		} else if err == gorm.ErrRecordNotFound {
			// Create new vote
			vote := &ReviewVote{
				ReviewID:   reviewID,
				CustomerID: customerID,
				VoteType:   voteType,
			}

			if err := tx.Create(vote).Error; err != nil {
				return err
			}

			// Update review counts
			var review ProductReview
			if err := tx.First(&review, reviewID).Error; err != nil {
				return err
			}

			if voteType == VoteTypeHelpful {
				review.HelpfulCount++
			} else {
				review.UnhelpfulCount++
			}

			return tx.Save(&review).Error
		}

		return err
	})
}

// ReportReview reports a review
func ReportReview(db *gorm.DB, reviewID, reporterID uuid.UUID, reason ReportReason, description *string) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Create report
		report := &ReviewReport{
			ReviewID:    reviewID,
			ReporterID:  reporterID,
			Reason:      reason,
			Description: description,
			Status:      "PENDING",
		}

		if err := tx.Create(report).Error; err != nil {
			return err
		}

		// Update review
		var review ProductReview
		if err := tx.First(&review, reviewID).Error; err != nil {
			return err
		}

		review.ReportCount++

		// Auto-flag if too many reports
		if review.ReportCount >= 5 && review.Status == ReviewStatusApproved {
			review.Flag()
		}

		return tx.Save(&review).Error
	})
}

// AutoModerateReviews auto-moderates reviews based on rules
func AutoModerateReviews(db *gorm.DB) error {
	// Auto-approve reviews from verified purchases with good history
	// This is a simplified example
	return db.Model(&ProductReview{}).
		Where("status = ? AND is_verified_purchase = ? AND report_count = 0 AND created_at < ?",
			ReviewStatusPending, true, time.Now().Add(-24*time.Hour)).
		Update("status", ReviewStatusApproved).Error
}

// CleanupOldReports cleans up resolved reports
func CleanupOldReports(db *gorm.DB, daysOld int) error {
	cutoffDate := time.Now().AddDate(0, 0, -daysOld)
	return db.Where("status = 'resolved' AND reviewed_at < ?", cutoffDate).
		Delete(&ReviewReport{}).Error
}
